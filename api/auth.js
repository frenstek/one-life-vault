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
    return res.status(500).json({ error: 'Failed to create auth user' });
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

// ─── List Users (admin only) ─────────────────────────────────────────────────

async function handleListUsers(req, res) {
  // Verify the requester is authenticated and is admin
  const auth = await verifyAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (auth.profile?.role !== 'admin' && auth.profile?.role !== 'owner') {
    return res.status(403).json({ error: 'Forbidden. Admin access required.' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('List users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }

  res.status(200).json({ profiles: profiles || [] });
}

// ─── Update User (admin only) — name, email, role ────────────────────────────

async function handleUpdateUser(req, res) {
  const auth = await verifyAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  if (auth.profile?.role !== 'admin' && auth.profile?.role !== 'owner') {
    return res.status(403).json({ error: 'Forbidden. Admin access required.' });
  }

  const { user_id, full_name, email, role } = req.body || {};
  if (!user_id) return res.status(400).json({ error: 'Missing required field: user_id' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // Build profile update
  const profileUpdate = {};
  if (full_name && typeof full_name === 'string') profileUpdate.full_name = full_name.trim();
  if (email && typeof email === 'string') profileUpdate.email = email.toLowerCase().trim();
  if (role && ['admin', 'manager', 'staff'].includes(role)) profileUpdate.role = role;

  if (Object.keys(profileUpdate).length === 0) {
    return res.status(400).json({ error: 'No fields to update. Provide full_name, email, or role.' });
  }

  // Update profile table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .update(profileUpdate)
    .eq('id', user_id)
    .select()
    .single();

  if (profileError) {
    console.error('Update user error:', profileError);
    return res.status(500).json({ error: 'Failed to update user' });
  }

  // Update auth user (email + metadata)
  const authUpdate = {};
  if (profileUpdate.email) authUpdate.email = profileUpdate.email;
  if (profileUpdate.full_name || profileUpdate.role) {
    authUpdate.user_metadata = {};
    if (profileUpdate.full_name) authUpdate.user_metadata.full_name = profileUpdate.full_name;
    if (profileUpdate.role) authUpdate.user_metadata.role = profileUpdate.role;
  }

  const { error: authError } = await supabase.auth.admin.updateUserById(user_id, authUpdate);
  if (authError) {
    console.error('Auth update warning:', authError.message);
  }

  // Audit log
  await supabase.from('audit_log').insert({
    user_email: auth.user.email,
    action: 'update_user',
    resource_type: 'user',
    resource_id: user_id,
    resource_name: profile?.full_name || 'Unknown',
    details: profileUpdate,
  });

  res.status(200).json({ profile });
}

// ─── Update Role (admin only) ────────────────────────────────────────────────

async function handleUpdateRole(req, res) {
  // Verify the requester is authenticated and is admin
  const auth = await verifyAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (auth.profile?.role !== 'admin' && auth.profile?.role !== 'owner') {
    return res.status(403).json({ error: 'Forbidden. Admin access required.' });
  }

  const { user_id, role } = req.body || {};

  if (!user_id) {
    return res.status(400).json({ error: 'Missing required field: user_id' });
  }

  const validRoles = ['admin', 'manager', 'staff'];
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
  }

  // Prevent admin from demoting themselves
  if (user_id === auth.user.id) {
    return res.status(400).json({ error: 'You cannot change your own role' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  // Update the profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', user_id)
    .select()
    .single();

  if (error) {
    console.error('Update role error:', error);
    return res.status(500).json({ error: 'Failed to update role' });
  }

  // Also update user_metadata in auth
  await supabase.auth.admin.updateUserById(user_id, {
    user_metadata: { role },
  });

  // Log the action
  await supabase.from('audit_log').insert({
    user_email: auth.user.email,
    action: 'update_role',
    resource_type: 'user',
    resource_id: user_id,
    resource_name: profile?.full_name || 'Unknown',
    details: { new_role: role },
  });

  res.status(200).json({ profile });
}

// ─── Delete User (admin only) ────────────────────────────────────────────────

async function handleDeleteUser(req, res) {
  const auth = await verifyAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (auth.profile?.role !== 'admin' && auth.profile?.role !== 'owner') {
    return res.status(403).json({ error: 'Forbidden. Admin access required.' });
  }

  const { user_id } = req.body || {};
  if (!user_id) {
    return res.status(400).json({ error: 'Missing required field: user_id' });
  }

  // Prevent admin from deleting themselves
  if (user_id === auth.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  // Get profile name before deletion for audit log
  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user_id)
    .single();

  // Delete profile first
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', user_id);

  if (profileError) {
    console.error('Delete profile error:', profileError);
  }

  // Delete auth user
  const { error: authError } = await supabase.auth.admin.deleteUser(user_id);
  if (authError) {
    console.error('Delete auth user error:', authError);
    return res.status(500).json({ error: 'Failed to delete user' });
  }

  // Log the action
  await supabase.from('audit_log').insert({
    user_email: auth.user.email,
    action: 'delete_user',
    resource_type: 'user',
    resource_id: user_id,
    resource_name: profileData?.full_name || 'Unknown',
    details: { email: profileData?.email },
  });

  res.status(200).json({ success: true });
}

// ─── Reset Password (admin only) ──────────────────────────────────────────

async function handleResetPassword(req, res) {
  const auth = await verifyAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  if (auth.profile?.role !== 'admin' && auth.profile?.role !== 'owner') return res.status(403).json({ error: 'Forbidden. Admin access required.' });

  const { user_id, new_password } = req.body || {};
  if (!user_id) return res.status(400).json({ error: 'Missing required field: user_id' });
  if (!new_password || new_password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // Update auth password
  const { error: authError } = await supabase.auth.admin.updateUserById(user_id, { password: new_password });
  if (authError) {
    console.error('Reset password error:', authError);
    return res.status(500).json({ error: 'Failed to reset password' });
  }

  /*  Name the account that was actually reset.
   *
   *  This referenced a bare `profile`, which is declared in other handlers in
   *  this file but NOT in this one — so it threw a ReferenceError every time.
   *  Optional chaining does not help: `profile?.x` still throws when `profile`
   *  is undeclared rather than undefined.
   *
   *  The effect was nasty and silent: the password was already changed by the
   *  call above, then this line threw, the caller got a 500, and NO audit row
   *  was written. A credential change with no audit trail is exactly what an
   *  NDIS audit asks to see. */
  const { data: target } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user_id)
    .maybeSingle();

  await supabase.from('audit_log').insert({
    user_email: auth.user.email,
    action: 'reset_password',
    resource_type: 'user',
    resource_id: user_id,
    resource_name: target?.full_name || 'Unknown',
  });

  res.status(200).json({ success: true });
}

// ─── Refresh Token ──────────────────────────────────────────────────────────

async function handleRefreshToken(req, res) {
  const { refresh_token } = req.body || {};
  if (!refresh_token) return res.status(400).json({ error: 'Missing refresh_token' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const { data, error } = await supabase.auth.refreshSession({ refresh_token });

  if (error || !data.session) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }

  const { session, user } = data;

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  res.status(200).json({
    user: { id: user.id, email: user.email, created_at: user.created_at },
    session: {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in,
    },
    profile: profile || null,
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
        case 'list-users':
          return await handleListUsers(req, res);
        case 'update-user':
          return await handleUpdateUser(req, res);
        case 'update-role':
          return await handleUpdateRole(req, res);
        case 'delete-user':
          return await handleDeleteUser(req, res);
        case 'reset-password':
          return await handleResetPassword(req, res);
        case 'refresh':
          return await handleRefreshToken(req, res);
        default:
          return res.status(400).json({ error: 'Missing or invalid action. Valid POST actions: login, signup, list-users, update-role, delete-user, reset-password, refresh' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Auth handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
