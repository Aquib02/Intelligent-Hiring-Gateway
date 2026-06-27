import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup'; // <--- NAYA PAGE IMPORT KIYA
import EmployeeDashboard from './pages/EmployeeDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';
import ProfileForm from './pages/ProfileForm';
import RoleSelection from './pages/RoleSelection';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} /> {/* <--- NAYA ROUTE ADD KIYA */}
          <Route path="/employee/profile" element={<ProfileForm />} />
          <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
          <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
          <Route path="/select-role" element={<RoleSelection />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;