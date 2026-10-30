import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import JobSeekerDashboard from './pages/JobSeekerDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';
import RoleSelection from './pages/RoleSelection';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 font-sans selection:bg-purple-500 selection:text-white">
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Role Assignment */}
          <Route
            path="/select-role"
            element={
              <ProtectedRoute>
                <RoleSelection />
              </ProtectedRoute>
            }
          />

          {/* JobSeeker Portal (Protected with Strict RBAC) */}
          <Route
            path="/jobseeker/dashboard"
            element={
              <ProtectedRoute allowedRoles={['jobseeker', 'employee']}>
                <JobSeekerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Backward-compatible alias for /employee/dashboard */}
          <Route
            path="/employee/dashboard"
            element={
              <ProtectedRoute allowedRoles={['jobseeker', 'employee']}>
                <JobSeekerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Profile Route Redirect to Integrated Dashboard Panel */}
          <Route
            path="/employee/profile"
            element={<Navigate to="/jobseeker/dashboard" replace />}
          />

          {/* Recruiter Portal (Protected with Strict RBAC) */}
          <Route
            path="/recruiter/dashboard"
            element={
              <ProtectedRoute allowedRoles={['recruiter']}>
                <RecruiterDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
