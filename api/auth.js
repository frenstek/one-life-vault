import { createClient } from '@supabase/supabase-js';
import { setCors, handleOptions } from './_lib/cors.js';
import { verifyAuth } from './_lib/auth.js';

// ─── GET Handler (me) ────────────────────────────────────────────────────────

async function handleMe(req, res) {
  const auth = await verifyAuth(req);

  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized. Provide a valid Bearer token in the Authorization header.' });
  }

  const { user, profile } = auth;

  res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
    },
    profile: profile || null,
  });
}

// ─── POST Handlers ───────────────────────────────────────────────────────────

async function handleLogin(req, res) {
  const { email, password } = req.body || {};

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Missing required field: email' });
  }
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Missing required field: password' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  });

  if (error) {
    console.error('Login error:', error);
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const { user, session } = data;

  // Fetch profile with role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.warn('Profile fetch warning:', profileError.message);
  }

  res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    },
    session: {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in,
    },
    profile: profile || null,
  });
}

async function handleSignup(req, res) {
  const { email, password, full_name, role } = req.body || {};

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Missing required field: email' });
  }
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Missing required field: password' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  if (!full_name || typeof full_name !== 'string') {
    return res.status(400).json({ error: 'Missing required field: full_name' });
  }

  const validRoles = ['admin', 'manager', 'staff'];
  const userRole = role && validRoles.includes(role) ? role : 'staff';

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  // Create auth user via admin API (service role)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email.toLowerCase().trim(),
    password,
    email_confirm: true, // Auto-confirm since admin is creating
    user_metadata: {
      full_name: full_name.trim(),
      role: userRole,
    },
  });

  if (authError) {
    console.error('Auth user creation error:', authError);
    if (authError.message?.includes('already been registered')) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }
    return res.status(500).json({ error: 'Failed to create auth user', details: authError.message });
  }

  const user = authData.user;

  // Create profile record
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email,
      full_name: full_name.trim(),
      role: userRole,
    })
    .select()
    .single();

  if (profileError) {
    console.error('Profile creation error:', profileError);
    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile: null,
      warning: 'User created but profile insertion failed: ' + profileError.message,
    });
  }

  // Log the action
  await supabase.from('audit_log').insert({
    user_email: 'admin',
    action: 'create_user',
    resource_type: 'user',
    resource_id: user.id,
    resource_name: full_name.trim(),
    details: { email: user.email, role: userRole },
  });

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    },
    profile,
  });
}

// ─── Main Router ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  try {
    if (req.method === 'GET') {
      return await handleMe(req, res);
    }

    if (req.method === 'POST') {
      const action = req.body?.action || req.query?.action;
      switch (action) {
        case 'login':
          return await handleLogin(req, res);
        case 'signup':
          return await handleSignup(req, res);
        default:
          return res.status(400).json({ error: 'Missing or invalid action. Valid POST actions: login, signup' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Auth handler error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
