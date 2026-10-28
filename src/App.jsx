import { Component } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PermissionsProvider, usePermissions } from './hooks/usePermissions';

// ─── Error Boundary — catches React render errors ─────────────────────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('App error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#f4f4f4] dark:bg-[#0c1425] p-6">
          <div className="w-full max-w-md rounded-xl border border-red-200 dark:border-red-900 bg-white dark:bg-[#162036] p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">An unexpected error occurred. Please refresh the page to continue.</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-600"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import DocumentView from './pages/DocumentView';
import Search from './pages/Search';
import Login from './pages/Login';
import StaffList from './pages/StaffList';
import StaffProfile from './pages/StaffProfile';
import Compliance from './pages/Compliance';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Inquiries from './pages/Inquiries';
import InquiryDetail from './pages/InquiryDetail';
import Participants from './pages/Participants';
import ParticipantProfile from './pages/ParticipantProfile';
import Stakeholders from './pages/Stakeholders';
import TimeClock from './pages/TimeClock';
import TaskBoard from './pages/TaskBoard';
import Incidents from './pages/Incidents';
import Announcements from './pages/Announcements';
import Messages from './pages/Messages';
import TeamChat from './pages/TeamChat';
import ShiftRoster from './pages/ShiftRoster';
import ContinuousImprovement from './pages/ContinuousImprovement';
import RiskRegister from './pages/RiskRegister';
import HazardRegister from './pages/HazardRegister';
import FeedbackComplaints from './pages/FeedbackComplaints';
import InfectionRegister from './pages/InfectionRegister';
import SDSRegister from './pages/SDSRegister';
import ScreeningChecklist from './pages/ScreeningChecklist';
import RosterOfCare from './pages/RosterOfCare';
import RosterOfCareBuilder from './pages/RosterOfCareBuilder';
import Invoices from './pages/Invoices';
import ParticipantInvoices from './pages/ParticipantInvoices';
import ProgressNotes from './pages/ProgressNotes';
import NotesCheck from './pages/NotesCheck';
import StaffAccounts from './pages/StaffAccounts';
import StaffPayslips from './pages/StaffPayslips';
import Permissions from './pages/Permissions';
import Rosters from './pages/Rosters';
import LegislationRegister from './pages/LegislationRegister';
import ConflictOfInterest from './pages/ConflictOfInterest';
import AuditCalendar from './pages/AuditCalendar';
import AssetRegister from './pages/AssetRegister';
import ExpenseTracker from './pages/ExpenseTracker';
import ExpenseHub from './pages/ExpenseHub';
import TrainingHub from './pages/TrainingHub';
import CleaningSchedule from './pages/CleaningSchedule';
import PayrollDetails from './pages/PayrollDetails';
import LocationLog from './pages/LocationLog';
import AuditLog from './pages/AuditLog';
import PolicyRegister from './pages/PolicyRegister';
import PaymentReviews from './pages/PaymentReviews';
import PaymentReview from './pages/PaymentReview';

/**
 * ProtectedRoute — guards routes by authentication, role, and dynamic permissions.
 *
 * Props:
 *   allowedRoles — array of roles that can access, e.g. ['admin', 'manager'].
 *                  If omitted, any authenticated user can access.
 *   adminOnly    — shorthand for allowedRoles=['admin'] (kept for backward compat).
 *   feature      — dynamic permission feature key (checked via role_permissions table).
 */
function ProtectedRoute({ children, adminOnly = false, allowedRoles, feature }) {
  const { isAuthenticated, isAdmin, loading, userRole } = useAuth();
  const { canAccess } = usePermissions();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f4f4f4] dark:bg-[#0c1425]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-[#0ea03e]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admin-only shorthand
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Dynamic feature-based permission check
  if (feature && !canAccess(feature)) {
    return <Navigate to="/" replace />;
  }

  // Role-based access (fallback) — owner bypasses all role checks
  if (allowedRoles && allowedRoles.length > 0 && userRole !== 'owner' && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function LoginRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f4f4f4] dark:bg-[#0c1425]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-[#0ea03e]" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Login />;
}

export default function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <PermissionsProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginRoute />} />

          {/* Protected routes with layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard — all roles */}
            <Route index element={<Dashboard />} />

            {/* Documents — dynamic permission */}
            <Route path="documents" element={
              <ProtectedRoute feature="documents">
                <Documents />
              </ProtectedRoute>
            } />
            <Route path="view/:fileId" element={
              <ProtectedRoute feature="documents">
                <DocumentView />
              </ProtectedRoute>
            } />
            <Route path="search" element={
              <ProtectedRoute feature="documents">
                <Search />
              </ProtectedRoute>
            } />

            {/* Participants — dynamic permission */}
            <Route path="participants" element={
              <ProtectedRoute feature="participants">
                <Participants />
              </ProtectedRoute>
            } />
            <Route path="participants/:participantId" element={
              <ProtectedRoute feature="participants">
                <ParticipantProfile />
              </ProtectedRoute>
            } />

            {/* Progress Notes — dynamic permission */}
            <Route path="progress-notes" element={
              <ProtectedRoute feature="progress-notes">
                <ProgressNotes />
              </ProtectedRoute>
            } />

            {/* Missing progress notes check — same permission as progress notes */}
            <Route path="notes-check" element={
              <ProtectedRoute feature="progress-notes">
                <NotesCheck />
              </ProtectedRoute>
            } />

            {/* Cleaning Schedule — all roles */}
            <Route path="cleaning-schedule" element={<CleaningSchedule />} />

            {/* Payroll Details — owner only */}
            <Route path="payroll" element={
              <ProtectedRoute allowedRoles={['owner']}>
                <PayrollDetails />
              </ProtectedRoute>
            } />

            {/* Time Clock — dynamic permission */}
            <Route path="time-clock" element={
              <ProtectedRoute feature="time-clock">
                <TimeClock />
              </ProtectedRoute>
            } />

            {/* Location Log — admin only */}
            <Route path="location-log" element={
              <ProtectedRoute allowedRoles={['owner', 'admin']}>
                <LocationLog />
              </ProtectedRoute>
            } />

            {/* Tasks — dynamic permission */}
            <Route path="tasks" element={
              <ProtectedRoute feature="tasks">
                <TaskBoard />
              </ProtectedRoute>
            } />

            {/* Messages — all roles (no feature gate) */}
            <Route path="messages" element={<Messages />} />

            {/* Team Chat — all roles */}
            <Route path="team-chat" element={<TeamChat />} />

            {/* Shift Roster — dynamic permission */}
            <Route path="shift-roster" element={
              <ProtectedRoute feature="shift-roster">
                <ShiftRoster />
              </ProtectedRoute>
            } />

            {/* Staff Directory — dynamic permission */}
            <Route path="staff" element={
              <ProtectedRoute feature="staff-directory">
                <StaffList />
              </ProtectedRoute>
            } />
            <Route path="staff/:staffId" element={
              <ProtectedRoute feature="staff-directory">
                <StaffProfile />
              </ProtectedRoute>
            } />

            {/* Compliance — dynamic permission (uses documents permission) */}
            <Route path="compliance" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <Compliance />
              </ProtectedRoute>
            } />

            {/* Inquiries — admin/manager */}
            <Route path="inquiries" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <Inquiries />
              </ProtectedRoute>
            } />
            <Route path="inquiries/:inquiryId" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <InquiryDetail />
              </ProtectedRoute>
            } />

            {/* Stakeholders — admin/manager */}
            <Route path="stakeholders" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <Stakeholders />
              </ProtectedRoute>
            } />

            {/* Incidents — dynamic permission */}
            <Route path="incidents" element={
              <ProtectedRoute feature="incidents">
                <Incidents />
              </ProtectedRoute>
            } />

            {/* Screening — admin/manager */}
            <Route path="screening" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <ScreeningChecklist />
              </ProtectedRoute>
            } />

            {/* Roster of Care — dynamic permission */}
            <Route path="roster-of-care" element={
              <ProtectedRoute feature="roster-of-care">
                <RosterOfCare />
              </ProtectedRoute>
            } />
            <Route path="roster-of-care/:rocId" element={
              <ProtectedRoute feature="roster-of-care">
                <RosterOfCareBuilder />
              </ProtectedRoute>
            } />

            {/* Rosters — admin only (server-enforced too) */}
            <Route path="rosters" element={
              <ProtectedRoute adminOnly>
                <Rosters />
              </ProtectedRoute>
            } />

            {/* Invoices — dynamic permission */}
            <Route path="invoices" element={
              <ProtectedRoute feature="invoices">
                <Invoices />
              </ProtectedRoute>
            } />
            <Route path="invoices/:participantId" element={
              <ProtectedRoute feature="invoices">
                <ParticipantInvoices />
              </ProtectedRoute>
            } />

            {/* Staff Payslips — dynamic permission */}
            <Route path="staff-payslips" element={
              <ProtectedRoute feature="staff-payslips">
                <StaffPayslips />
              </ProtectedRoute>
            } />

            {/* Properties — dynamic permission */}
            <Route path="properties" element={
              <ProtectedRoute feature="properties">
                <Properties />
              </ProtectedRoute>
            } />
            <Route path="properties/:propertyId" element={
              <ProtectedRoute feature="properties">
                <PropertyDetail />
              </ProtectedRoute>
            } />

            {/* Training Hub — all roles */}
            <Route path="training" element={<TrainingHub />} />

            {/* Announcements — dynamic permission */}
            <Route path="announcements" element={
              <ProtectedRoute feature="announcements">
                <Announcements />
              </ProtectedRoute>
            } />

            {/* Registers — admin & manager only */}
            <Route path="continuous-improvement" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <ContinuousImprovement />
              </ProtectedRoute>
            } />
            <Route path="risk-register" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <RiskRegister />
              </ProtectedRoute>
            } />
            <Route path="hazard-register" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <HazardRegister />
              </ProtectedRoute>
            } />
            <Route path="feedback-complaints" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <FeedbackComplaints />
              </ProtectedRoute>
            } />
            <Route path="infection-register" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <InfectionRegister />
              </ProtectedRoute>
            } />
            <Route path="sds-register" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <SDSRegister />
              </ProtectedRoute>
            } />
            <Route path="legislation-register" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <LegislationRegister />
              </ProtectedRoute>
            } />
            <Route path="conflict-of-interest" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <ConflictOfInterest />
              </ProtectedRoute>
            } />
            <Route path="audit-calendar" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <AuditCalendar />
              </ProtectedRoute>
            } />
            <Route path="audit-log" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <AuditLog />
              </ProtectedRoute>
            } />
            <Route path="policy-register" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <PolicyRegister />
              </ProtectedRoute>
            } />

            {/* Payment Review Desk — NDIA payment integrity reviews, admin/manager (server-enforced too) */}
            <Route path="payment-reviews" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <PaymentReviews />
              </ProtectedRoute>
            } />
            <Route path="payment-reviews/:reviewId" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <PaymentReview />
              </ProtectedRoute>
            } />

            {/* Admin-only routes */}
            <Route path="staff-accounts" element={
              <ProtectedRoute feature="staff-accounts">
                <StaffAccounts />
              </ProtectedRoute>
            } />

            {/* Asset Register — admin/manager */}
            <Route path="asset-register" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <AssetRegister />
              </ProtectedRoute>
            } />

            {/* Expense Tracker — admin/manager */}
            <Route path="expenses" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <ExpenseTracker />
              </ProtectedRoute>
            } />

            {/* Expense Hub — admin/manager */}
            <Route path="expense-hub" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <ExpenseHub />
              </ProtectedRoute>
            } />

            {/* Permissions — admin only (hardcoded, not dynamic) */}
            <Route path="permissions" element={
              <ProtectedRoute adminOnly>
                <Permissions />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </PermissionsProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}
