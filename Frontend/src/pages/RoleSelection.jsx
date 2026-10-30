import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaLaptopCode, FaUserTie } from 'react-icons/fa';
import { API_BASE_URL } from '../config';
import { setAuthSession } from '../utils/auth';

export default function RoleSelection() {
  const navigate = useNavigate();

  const handleRoleSelection = async (selectedRole) => {
    const userId = localStorage.getItem('user_id');

    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('role', selectedRole);

    try {
      const res = await axios.post(`${API_BASE_URL}/user/set-role`, formData);
      if (res.data?.access_token) {
        setAuthSession({ access_token: res.data.access_token, user_id: userId, role: selectedRole });
      } else {
        localStorage.setItem('role', selectedRole);
      }

      if (selectedRole === 'jobseeker' || selectedRole === 'employee') {
        navigate('/jobseeker/dashboard');
      } else if (selectedRole === 'recruiter') {
        navigate('/recruiter/dashboard');
      }
    } catch (error) {
      alert("Error setting role. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2ff] p-4">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center">
        <h2 className="text-3xl font-black text-gray-900 mb-3">Choose Your Portal</h2>
        <p className="text-gray-500 mb-8">Role-Based Access Control: Select how you wish to use Intelligent Hiring Gateway.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            onClick={() => handleRoleSelection('jobseeker')}
            className="cursor-pointer border-2 border-transparent hover:border-[#6e4ef2] bg-purple-50 hover:bg-purple-100/50 p-8 rounded-2xl transition duration-300 flex flex-col items-center group shadow-sm hover:shadow-md"
          >
            <div className="w-16 h-16 bg-[#6e4ef2] text-white rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition">
              <FaLaptopCode />
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-1">Job Seeker</h3>
            <p className="text-xs text-gray-500">Scan resumes with AI ATS, explore matches, and track applications.</p>
          </div>

          <div 
            onClick={() => handleRoleSelection('recruiter')}
            className="cursor-pointer border-2 border-transparent hover:border-[#6e4ef2] bg-blue-50 hover:bg-blue-100/50 p-8 rounded-2xl transition duration-300 flex flex-col items-center group shadow-sm hover:shadow-md"
          >
            <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition">
              <FaUserTie />
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-1">Recruiter / HR</h3>
            <p className="text-xs text-gray-500">Post jobs, rank candidates by ATS score, generate interview questions.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
