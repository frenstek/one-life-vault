import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
import ShiftRoster from './pages/ShiftRoster';
import ContinuousImprovement from './pages/ContinuousImprovement';
import RiskRegister from './pages/RiskRegister';
import HazardRegister from './pages/HazardRegister';
import FeedbackComplaints from './pages/FeedbackComplaints';
import ScreeningChecklist from './pages/ScreeningChecklist';
import RosterOfCare from './pages/RosterOfCare';
import RosterOfCareBuilder from './pages/RosterOfCareBuilder';

function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

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

  if (adminOnly && !isAdmin) {
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
    <AuthProvider>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<LoginRoute />} />

        {/* Protected routes with layout */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="documents" element={<Documents />} />
          <Route path="view/:fileId" element={<DocumentView />} />
          <Route path="search" element={<Search />} />

          {/* Management routes — accessible to all authenticated users */}
          <Route path="staff" element={<StaffList />} />
          <Route path="staff/:staffId" element={<StaffProfile />} />
          <Route path="compliance" element={<Compliance />} />
          <Route path="inquiries" element={<Inquiries />} />
          <Route path="inquiries/:inquiryId" element={<InquiryDetail />} />
          <Route path="participants" element={<Participants />} />
          <Route path="participants/:participantId" element={<ParticipantProfile />} />
          <Route path="stakeholders" element={<Stakeholders />} />
          <Route path="time-clock" element={<TimeClock />} />
          <Route path="tasks" element={<TaskBoard />} />
          <Route path="properties" element={<Properties />} />
          <Route path="properties/:propertyId" element={<PropertyDetail />} />
          <Route path="screening" element={<ScreeningChecklist />} />
          <Route path="incidents" element={<Incidents />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="messages" element={<Messages />} />
          <Route path="shift-roster" element={<ShiftRoster />} />
          <Route path="continuous-improvement" element={<ContinuousImprovement />} />
          <Route path="risk-register" element={<RiskRegister />} />
          <Route path="hazard-register" element={<HazardRegister />} />
          <Route path="feedback-complaints" element={<FeedbackComplaints />} />
          <Route path="roster-of-care" element={<RosterOfCare />} />
          <Route path="roster-of-care/:rocId" element={<RosterOfCareBuilder />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
