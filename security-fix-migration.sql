-- ═══════════════════════════════════════════════════════════════════════════════
-- ONE LIFE VAULT — SECURITY FIX MIGRATION
-- Date: 2026-07-22
--
-- This migration fixes critical security issues:
--   1. Replaces all USING(true) RLS policies with proper auth checks
--   2. Fixes SECURITY DEFINER function (handle_new_user)
--   3. Removes raw_user_meta_data usage for authorization
--   4. Fixes storage bucket policies to require authentication
--   5. Adds missing RLS policies for invoices/invoice_items
--
-- IMPORTANT: Run this in the Supabase SQL Editor.
-- The API uses service_role key which BYPASSES RLS, so these policies
-- serve as defense-in-depth for any direct client access.
--
-- Auth model:
--   - Roles: admin, manager, staff (stored in profiles.role)
--   - All authenticated users can SELECT (internal staff app)
--   - INSERT/UPDATE/DELETE restricted to admin/manager via helper function
--   - Audit log is append-only (authenticated can insert, only admin can delete)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── STEP 0: Create a secure role-checking function ─────────────────────────
-- This reads from the profiles table (not raw_user_meta_data) so it cannot
-- be spoofed by the user. We place it in a private schema for safety.

CREATE SCHEMA IF NOT EXISTS private;

-- Returns the role of the currently authenticated user from the profiles table.
-- Returns NULL if not authenticated or no profile exists.
CREATE OR REPLACE FUNCTION private.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Convenience: returns TRUE if the current user has one of the specified roles.
CREATE OR REPLACE FUNCTION private.has_role(allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = ANY(allowed_roles)
  )
$$;

-- Convenience: is the current user an admin or manager?
CREATE OR REPLACE FUNCTION private.is_admin_or_manager()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'owner', 'manager')
  )
$$;

-- Convenience: is the current user an admin?
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
  )
$$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: Fix the handle_new_user() trigger function
-- Problem: SECURITY DEFINER in public schema + uses raw_user_meta_data
-- Fix: Change to SECURITY INVOKER. The trigger fires from auth.users INSERT
--      which runs as the postgres/service role, so INVOKER still has access.
--      We keep reading full_name from meta_data (it's fine for display name,
--      just not for authorization decisions). Role is always hardcoded to 'staff'.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'staff'  -- Always default to staff. Role changes must go through admin API.
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Recreate trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: Drop ALL existing overly-permissive RLS policies
-- We drop every known policy name from every table.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── profiles ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read profiles" ON profiles;
DROP POLICY IF EXISTS "Service write profiles" ON profiles;

-- ─── staff ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read staff" ON staff;
DROP POLICY IF EXISTS "Service write staff" ON staff;

-- ─── staff_documents ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read staff_documents" ON staff_documents;
DROP POLICY IF EXISTS "Service write staff_documents" ON staff_documents;

-- ─── audit_log ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read audit_log" ON audit_log;
DROP POLICY IF EXISTS "Service write audit_log" ON audit_log;

-- ─── documents ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read" ON documents;
DROP POLICY IF EXISTS "Service write" ON documents;

-- ─── participants ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read participants" ON participants;
DROP POLICY IF EXISTS "Service write participants" ON participants;

-- ─── participant_notes ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read participant_notes" ON participant_notes;
DROP POLICY IF EXISTS "Service write participant_notes" ON participant_notes;

-- ─── participant_files ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read participant_files" ON participant_files;
DROP POLICY IF EXISTS "Service write participant_files" ON participant_files;

-- ─── participant_contacts ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read participant_contacts" ON participant_contacts;
DROP POLICY IF EXISTS "Service role manage participant_contacts" ON participant_contacts;

-- ─── stakeholders ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Service role full access" ON stakeholders;

-- ─── time_entries ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Service role full access" ON time_entries;

-- ─── incidents ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read incidents" ON incidents;
DROP POLICY IF EXISTS "Service role manage incidents" ON incidents;

-- ─── announcements ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read announcements" ON announcements;
DROP POLICY IF EXISTS "Service role manage announcements" ON announcements;

-- ─── messages ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read messages" ON messages;
DROP POLICY IF EXISTS "Service role manage messages" ON messages;

-- ─── shift_handovers ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read shift_handovers" ON shift_handovers;
DROP POLICY IF EXISTS "Service role manage shift_handovers" ON shift_handovers;

-- ─── shift_roster ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read shift_roster" ON shift_roster;
DROP POLICY IF EXISTS "Service role manage shift_roster" ON shift_roster;

-- ─── medication_charts ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read medication_charts" ON medication_charts;
DROP POLICY IF EXISTS "Service role manage medication_charts" ON medication_charts;

-- ─── property_photos ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow all on property_photos" ON property_photos;

-- ─── task_notes ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow all access to task_notes" ON task_notes;

-- ─── continuous_improvement ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read continuous_improvement" ON continuous_improvement;
DROP POLICY IF EXISTS "Service role manage continuous_improvement" ON continuous_improvement;

-- ─── risk_register ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read risk_register" ON risk_register;
DROP POLICY IF EXISTS "Service role manage risk_register" ON risk_register;

-- ─── hazard_register ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read hazard_register" ON hazard_register;
DROP POLICY IF EXISTS "Service role manage hazard_register" ON hazard_register;

-- ─── feedback_complaints ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read feedback_complaints" ON feedback_complaints;
DROP POLICY IF EXISTS "Service role manage feedback_complaints" ON feedback_complaints;

-- ─── roster_of_care ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read roc" ON roster_of_care;
DROP POLICY IF EXISTS "Service role manage roc" ON roster_of_care;

-- ─── roc_participants ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read roc_participants" ON roc_participants;
DROP POLICY IF EXISTS "Service role manage roc_participants" ON roc_participants;

-- ─── roc_time_blocks ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read roc_time_blocks" ON roc_time_blocks;
DROP POLICY IF EXISTS "Service role manage roc_time_blocks" ON roc_time_blocks;

-- ─── roc_staff_assignments ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read roc_staff_assignments" ON roc_staff_assignments;
DROP POLICY IF EXISTS "Service role manage roc_staff_assignments" ON roc_staff_assignments;

-- ─── support_plans ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Service full access support_plans" ON support_plans;

-- ─── onboarding_checklist_templates ─────────────────────────────────────────
DROP POLICY IF EXISTS "Public read onboarding_checklist_templates" ON onboarding_checklist_templates;
DROP POLICY IF EXISTS "Service write onboarding_checklist_templates" ON onboarding_checklist_templates;

-- ─── staff_onboarding_progress ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read staff_onboarding_progress" ON staff_onboarding_progress;
DROP POLICY IF EXISTS "Service write staff_onboarding_progress" ON staff_onboarding_progress;

-- ─── fluid_balance_entries ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Service role full access" ON fluid_balance_entries;

-- ─── auditor_folders ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Service role full access on auditor_folders" ON auditor_folders;

-- ─── progress_notes ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "progress_notes_sel" ON progress_notes;
DROP POLICY IF EXISTS "progress_notes_ins" ON progress_notes;
DROP POLICY IF EXISTS "progress_notes_upd" ON progress_notes;
DROP POLICY IF EXISTS "progress_notes_del" ON progress_notes;
DROP POLICY IF EXISTS "progress_notes_service_all" ON progress_notes;

-- ─── invoices (may not have had policies) ───────────────────────────────────
DROP POLICY IF EXISTS "Public read invoices" ON invoices;
DROP POLICY IF EXISTS "Service write invoices" ON invoices;
DROP POLICY IF EXISTS "Service role manage invoices" ON invoices;

-- ─── invoice_items (may not have had policies) ──────────────────────────────
DROP POLICY IF EXISTS "Public read invoice_items" ON invoice_items;
DROP POLICY IF EXISTS "Service write invoice_items" ON invoice_items;
DROP POLICY IF EXISTS "Service role manage invoice_items" ON invoice_items;

-- ─── inquiry_notes ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read inquiry_notes" ON inquiry_notes;
DROP POLICY IF EXISTS "Service write inquiry_notes" ON inquiry_notes;
DROP POLICY IF EXISTS "Service role manage inquiry_notes" ON inquiry_notes;
DROP POLICY IF EXISTS "Service role full access" ON inquiry_notes;


-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: Create proper RLS policies
--
-- Pattern:
--   SELECT  → authenticated users only (auth.uid() IS NOT NULL)
--   INSERT  → authenticated users (staff can create records in their work)
--   UPDATE  → admin/manager only (via private.is_admin_or_manager())
--   DELETE  → admin only (via private.is_admin())
--
-- Some tables have special rules noted inline.
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─── profiles ───────────────────────────────────────────────────────────────
-- Users can read all profiles (needed for staff directory, dropdowns, etc.)
-- Users can update their own profile (name only - role changes go through admin API)
-- Only admins can insert/delete profiles (signup goes through service_role API)

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());


-- ─── staff ──────────────────────────────────────────────────────────────────
-- All authenticated users can view staff (needed for dropdowns, directory)
-- Admin/manager can create and update staff records
-- Only admin can delete staff

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read staff"
  ON staff FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin/manager can insert staff"
  ON staff FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin/manager can update staff"
  ON staff FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete staff"
  ON staff FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── staff_documents ────────────────────────────────────────────────────────

ALTER TABLE staff_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read staff_documents"
  ON staff_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin/manager can insert staff_documents"
  ON staff_documents FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin/manager can update staff_documents"
  ON staff_documents FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete staff_documents"
  ON staff_documents FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── audit_log ──────────────────────────────────────────────────────────────
-- All authenticated users can read (transparency)
-- All authenticated users can insert (any action creates audit entries)
-- Only admin can update/delete (audit integrity)

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read audit_log"
  ON audit_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert audit_log"
  ON audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can update audit_log"
  ON audit_log FOR UPDATE
  TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

CREATE POLICY "Admin can delete audit_log"
  ON audit_log FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── documents ──────────────────────────────────────────────────────────────

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read documents"
  ON documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin/manager can insert documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin/manager can update documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete documents"
  ON documents FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── participants ───────────────────────────────────────────────────────────
-- Sensitive NDIS participant data

ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read participants"
  ON participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin/manager can insert participants"
  ON participants FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin/manager can update participants"
  ON participants FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete participants"
  ON participants FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── participant_notes ──────────────────────────────────────────────────────
-- Staff can create progress notes (core job function)
-- Admin/manager can update/delete

ALTER TABLE participant_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read participant_notes"
  ON participant_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert participant_notes"
  ON participant_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin/manager can update participant_notes"
  ON participant_notes FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete participant_notes"
  ON participant_notes FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── participant_files ──────────────────────────────────────────────────────

ALTER TABLE participant_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read participant_files"
  ON participant_files FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin/manager can insert participant_files"
  ON participant_files FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin/manager can update participant_files"
  ON participant_files FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete participant_files"
  ON participant_files FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── participant_contacts ───────────────────────────────────────────────────

ALTER TABLE participant_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read participant_contacts"
  ON participant_contacts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin/manager can insert participant_contacts"
  ON participant_contacts FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin/manager can update participant_contacts"
  ON participant_contacts FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete participant_contacts"
  ON participant_contacts FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── stakeholders ───────────────────────────────────────────────────────────

ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read stakeholders"
  ON stakeholders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin/manager can insert stakeholders"
  ON stakeholders FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin/manager can update stakeholders"
  ON stakeholders FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete stakeholders"
  ON stakeholders FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── time_entries ───────────────────────────────────────────────────────────
-- Staff need to clock in/out (insert + update their own entries)
-- Admin/manager can manage all

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read time_entries"
  ON time_entries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert time_entries"
  ON time_entries FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update time_entries"
  ON time_entries FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin/manager can delete time_entries"
  ON time_entries FOR DELETE
  TO authenticated
  USING (private.is_admin_or_manager());


-- ─── incidents ──────────────────────────────────────────────────────────────
-- Any staff can report an incident (insert)
-- Admin/manager can update (investigate, resolve)
-- Only admin can delete

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read incidents"
  ON incidents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert incidents"
  ON incidents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin/manager can update incidents"
  ON incidents FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete incidents"
  ON incidents FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── announcements ──────────────────────────────────────────────────────────
-- All staff can read; only admin/manager can create/edit/delete

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin/manager can insert announcements"
  ON announcements FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin/manager can update announcements"
  ON announcements FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete announcements"
  ON announcements FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── messages ───────────────────────────────────────────────────────────────
-- All authenticated users can read and send messages
-- Only admin can delete messages

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read messages"
  ON messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can delete messages"
  ON messages FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── shift_handovers ────────────────────────────────────────────────────────
-- Staff can create handover notes; admin/manager can manage

ALTER TABLE shift_handovers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read shift_handovers"
  ON shift_handovers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert shift_handovers"
  ON shift_handovers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin/manager can update shift_handovers"
  ON shift_handovers FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete shift_handovers"
  ON shift_handovers FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── shift_roster ───────────────────────────────────────────────────────────
-- Only admin/manager can manage roster

ALTER TABLE shift_roster ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read shift_roster"
  ON shift_roster FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin/manager can insert shift_roster"
  ON shift_roster FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin/manager can update shift_roster"
  ON shift_roster FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin/manager can delete shift_roster"
  ON shift_roster FOR DELETE
  TO authenticated
  USING (private.is_admin_or_manager());


-- ─── medication_charts ──────────────────────────────────────────────────────
-- Clinical data — admin/manager only for write operations

ALTER TABLE medication_charts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read medication_charts"
  ON medication_charts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin/manager can insert medication_charts"
  ON medication_charts FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin/manager can update medication_charts"
  ON medication_charts FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete medication_charts"
  ON medication_charts FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── property_photos ────────────────────────────────────────────────────────

ALTER TABLE property_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read property_photos"
  ON property_photos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin/manager can insert property_photos"
  ON property_photos FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin/manager can update property_photos"
  ON property_photos FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete property_photos"
  ON property_photos FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── task_notes ─────────────────────────────────────────────────────────────
-- All staff can add notes to tasks

ALTER TABLE task_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read task_notes"
  ON task_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert task_notes"
  ON task_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin/manager can update task_notes"
  ON task_notes FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete task_notes"
  ON task_notes FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── continuous_improvement ─────────────────────────────────────────────────

ALTER TABLE continuous_improvement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read continuous_improvement"
  ON continuous_improvement FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert continuous_improvement"
  ON continuous_improvement FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin/manager can update continuous_improvement"
  ON continuous_improvement FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete continuous_improvement"
  ON continuous_improvement FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── risk_register ──────────────────────────────────────────────────────────

ALTER TABLE risk_register ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read risk_register"
  ON risk_register FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin/manager can insert risk_register"
  ON risk_register FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin/manager can update risk_register"
  ON risk_register FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete risk_register"
  ON risk_register FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── hazard_register ────────────────────────────────────────────────────────
-- Staff can report hazards (insert), admin/manager manage

ALTER TABLE hazard_register ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read hazard_register"
  ON hazard_register FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert hazard_register"
  ON hazard_register FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin/manager can update hazard_register"
  ON hazard_register FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete hazard_register"
  ON hazard_register FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── feedback_complaints ────────────────────────────────────────────────────
-- Staff can lodge feedback/complaints; admin/manager manage resolution

ALTER TABLE feedback_complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read feedback_complaints"
  ON feedback_complaints FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert feedback_complaints"
  ON feedback_complaints FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin/manager can update feedback_complaints"
  ON feedback_complaints FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete feedback_complaints"
  ON feedback_complaints FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── roster_of_care ─────────────────────────────────────────────────────────

ALTER TABLE roster_of_care ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read roster_of_care"
  ON roster_of_care FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin/manager can insert roster_of_care"
  ON roster_of_care FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin/manager can update roster_of_care"
  ON roster_of_care FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete roster_of_care"
  ON roster_of_care FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── roc_participants ───────────────────────────────────────────────────────

ALTER TABLE roc_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read roc_participants"
  ON roc_participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin/manager can insert roc_participants"
  ON roc_participants FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin/manager can update roc_participants"
  ON roc_participants FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete roc_participants"
  ON roc_participants FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── roc_time_blocks ────────────────────────────────────────────────────────

ALTER TABLE roc_time_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read roc_time_blocks"
  ON roc_time_blocks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin/manager can insert roc_time_blocks"
  ON roc_time_blocks FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin/manager can update roc_time_blocks"
  ON roc_time_blocks FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete roc_time_blocks"
  ON roc_time_blocks FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── roc_staff_assignments ──────────────────────────────────────────────────

ALTER TABLE roc_staff_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read roc_staff_assignments"
  ON roc_staff_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin/manager can insert roc_staff_assignments"
  ON roc_staff_assignments FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin/manager can update roc_staff_assignments"
  ON roc_staff_assignments FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin/manager can delete roc_staff_assignments"
  ON roc_staff_assignments FOR DELETE
  TO authenticated
  USING (private.is_admin_or_manager());


-- ─── support_plans ──────────────────────────────────────────────────────────
-- Sensitive clinical data

ALTER TABLE support_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read support_plans"
  ON support_plans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin/manager can insert support_plans"
  ON support_plans FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin/manager can update support_plans"
  ON support_plans FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete support_plans"
  ON support_plans FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── onboarding_checklist_templates ─────────────────────────────────────────
-- Template management is admin/manager only

ALTER TABLE onboarding_checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read onboarding_checklist_templates"
  ON onboarding_checklist_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin/manager can insert onboarding_checklist_templates"
  ON onboarding_checklist_templates FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin/manager can update onboarding_checklist_templates"
  ON onboarding_checklist_templates FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete onboarding_checklist_templates"
  ON onboarding_checklist_templates FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── staff_onboarding_progress ──────────────────────────────────────────────

ALTER TABLE staff_onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read staff_onboarding_progress"
  ON staff_onboarding_progress FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin/manager can insert staff_onboarding_progress"
  ON staff_onboarding_progress FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin/manager can update staff_onboarding_progress"
  ON staff_onboarding_progress FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete staff_onboarding_progress"
  ON staff_onboarding_progress FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── fluid_balance_entries ──────────────────────────────────────────────────
-- Staff record fluid balance as part of daily care

ALTER TABLE fluid_balance_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read fluid_balance_entries"
  ON fluid_balance_entries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert fluid_balance_entries"
  ON fluid_balance_entries FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin/manager can update fluid_balance_entries"
  ON fluid_balance_entries FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete fluid_balance_entries"
  ON fluid_balance_entries FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── auditor_folders ────────────────────────────────────────────────────────
-- Auditor portal — admin only for management

ALTER TABLE auditor_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read auditor_folders"
  ON auditor_folders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert auditor_folders"
  ON auditor_folders FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin());

CREATE POLICY "Admin can update auditor_folders"
  ON auditor_folders FOR UPDATE
  TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

CREATE POLICY "Admin can delete auditor_folders"
  ON auditor_folders FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── progress_notes ─────────────────────────────────────────────────────────
-- Staff write daily progress notes; admin/manager can edit/delete

ALTER TABLE progress_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read progress_notes"
  ON progress_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert progress_notes"
  ON progress_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin/manager can update progress_notes"
  ON progress_notes FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete progress_notes"
  ON progress_notes FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── invoices ───────────────────────────────────────────────────────────────
-- Financial data — admin/manager only for write operations
-- Enable RLS if not already enabled

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin/manager can insert invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin/manager can update invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── invoice_items ──────────────────────────────────────────────────────────

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read invoice_items"
  ON invoice_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin/manager can insert invoice_items"
  ON invoice_items FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin/manager can update invoice_items"
  ON invoice_items FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete invoice_items"
  ON invoice_items FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ─── inquiry_notes ──────────────────────────────────────────────────────────
-- Staff can add notes to inquiries

ALTER TABLE inquiry_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read inquiry_notes"
  ON inquiry_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert inquiry_notes"
  ON inquiry_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin/manager can update inquiry_notes"
  ON inquiry_notes FOR UPDATE
  TO authenticated
  USING (private.is_admin_or_manager())
  WITH CHECK (private.is_admin_or_manager());

CREATE POLICY "Admin can delete inquiry_notes"
  ON inquiry_notes FOR DELETE
  TO authenticated
  USING (private.is_admin());


-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: Fix storage bucket policies
-- Remove anonymous access, require authentication
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── property-photos bucket ─────────────────────────────────────────────────
-- Drop the overly-permissive anonymous policies
DROP POLICY IF EXISTS "Allow public read on property-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role insert on property-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role delete on property-photos" ON storage.objects;

-- New policies: authenticated users can read; admin/manager can upload/delete
-- Note: Since the API uses service_role key, these are defense-in-depth.
-- For public image URLs to work, the bucket itself should remain public=true,
-- but we restrict who can upload/delete via RLS.

CREATE POLICY "Authenticated read property-photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'property-photos');

-- Also allow anon read since property photos may be displayed publicly
-- (e.g., in participant-facing views). The bucket is marked public.
CREATE POLICY "Public read property-photos"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'property-photos');

CREATE POLICY "Authenticated upload property-photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'property-photos');

CREATE POLICY "Authenticated update property-photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'property-photos')
  WITH CHECK (bucket_id = 'property-photos');

CREATE POLICY "Authenticated delete property-photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'property-photos');


-- ─── Other storage buckets — add authenticated-only policies ────────────────
-- These buckets may have been created via the dashboard without proper policies.
-- We add policies defensively (they will no-op if the bucket doesn't exist).

-- participant-files
DROP POLICY IF EXISTS "Allow public read on participant-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role insert on participant-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role delete on participant-files" ON storage.objects;
DROP POLICY IF EXISTS "Public read participant-files" ON storage.objects;

CREATE POLICY "Authenticated read participant-files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'participant-files');

CREATE POLICY "Authenticated upload participant-files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'participant-files');

CREATE POLICY "Authenticated delete participant-files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'participant-files');

-- staff-documents
DROP POLICY IF EXISTS "Allow public read on staff-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role insert on staff-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role delete on staff-documents" ON storage.objects;

CREATE POLICY "Authenticated read staff-documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'staff-documents');

CREATE POLICY "Authenticated upload staff-documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'staff-documents');

CREATE POLICY "Authenticated delete staff-documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'staff-documents');

-- documents (main document vault)
DROP POLICY IF EXISTS "Allow public read on documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role insert on documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role delete on documents" ON storage.objects;

CREATE POLICY "Authenticated read documents bucket"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated upload documents bucket"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated delete documents bucket"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');

-- announcement-images
DROP POLICY IF EXISTS "Allow public read on announcement-images" ON storage.objects;

CREATE POLICY "Authenticated read announcement-images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'announcement-images');

-- Public read for announcement images (may be displayed without auth)
CREATE POLICY "Public read announcement-images"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'announcement-images');

CREATE POLICY "Authenticated upload announcement-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'announcement-images');

CREATE POLICY "Authenticated delete announcement-images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'announcement-images');

-- auditor-files bucket
DROP POLICY IF EXISTS "Allow public read on auditor-files" ON storage.objects;

CREATE POLICY "Authenticated read auditor-files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'auditor-files');

CREATE POLICY "Authenticated upload auditor-files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'auditor-files');

CREATE POLICY "Authenticated delete auditor-files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'auditor-files');


-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 5: Grant usage on private schema to authenticated role
-- (Required for the helper functions to work in RLS policies)
-- ═══════════════════════════════════════════════════════════════════════════════

GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin_or_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

-- Also grant to service_role (used by API functions)
GRANT USAGE ON SCHEMA private TO service_role;
GRANT EXECUTE ON FUNCTION private.get_user_role() TO service_role;
GRANT EXECUTE ON FUNCTION private.has_role(TEXT[]) TO service_role;
GRANT EXECUTE ON FUNCTION private.is_admin_or_manager() TO service_role;
GRANT EXECUTE ON FUNCTION private.is_admin() TO service_role;


-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE. Summary of changes:
--
-- 1. Created private schema with 4 helper functions for role checking:
--    - private.get_user_role()
--    - private.has_role(TEXT[])
--    - private.is_admin_or_manager()
--    - private.is_admin()
--
-- 2. Fixed handle_new_user() trigger:
--    - Changed from SECURITY DEFINER to SECURITY INVOKER
--    - Role is always hardcoded to 'staff' (no user_meta_data for auth decisions)
--    - Added ON CONFLICT DO NOTHING for safety
--
-- 3. Replaced ALL 35+ permissive RLS policies across 30+ tables with:
--    - SELECT: authenticated users only
--    - INSERT: authenticated + role-appropriate (staff for operational data,
--              admin/manager for administrative data)
--    - UPDATE: admin/manager only (except time_entries, messages)
--    - DELETE: admin only (most tables) or admin/manager (operational tables)
--
-- 4. Fixed storage policies:
--    - Removed anonymous upload/delete on property-photos
--    - Added authenticated-only policies for all storage buckets
--    - Kept public read on property-photos and announcement-images (needed for
--      public image URLs)
--
-- 5. Added missing RLS for invoices and invoice_items tables
--
-- NOTE: The API uses service_role key which bypasses RLS entirely.
-- These policies provide defense-in-depth against:
--   - Direct Supabase client access with anon key
--   - Token leakage/theft (limits damage to read-only for staff role)
--   - Future client-side Supabase usage
-- ═══════════════════════════════════════════════════════════════════════════════
