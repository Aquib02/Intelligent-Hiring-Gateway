import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaLaptopCode, FaUserTie } from 'react-icons/fa';

export default function RoleSelection() {
  const navigate = useNavigate();

  const handleRoleSelection = async (selectedRole) => {
    const userId = localStorage.getItem('user_id');

    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('role', selectedRole);

    try {
      await axios.post('http://localhost:8000/user/set-role', formData);
      localStorage.setItem('role', selectedRole);

      if (selectedRole === 'employee') {
        navigate('/employee/profile');
      } else if (selectedRole === 'recruiter') {
        navigate('/recruiter/dashboard');
      }
    } catch (error) {
      alert("Role set karne mein error aayi.");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f2ff] p-4 relative overflow-hidden">
      
      {/* Background Decorative Circles (Matching Login Page) */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-[#6e4ef2] rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Header Section */}
      <div className="text-center z-10 mb-12">
        <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tight">Welcome Aboard! 🚀</h1>
        <p className="text-lg text-gray-600 font-medium max-w-md mx-auto">
          How would you like to use this platform? Select your role to get started.
        </p>
      </div>

      {/* Cards Container */}
      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl z-10 px-4">
        
        {/* Candidate Card */}
        <div 
          onClick={() => handleRoleSelection('employee')}
          className="bg-white p-10 rounded-[2rem] shadow-xl hover:shadow-2xl border-2 border-transparent hover:border-[#6e4ef2] transition-all duration-300 cursor-pointer transform hover:-translate-y-2 group flex flex-col items-center text-center relative overflow-hidden"
        >
          {/* Subtle background glow on hover */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#f0f2ff] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-[#f5f6fa] group-hover:bg-[#6e4ef2] group-hover:text-white text-[#6e4ef2] flex items-center justify-center text-4xl mb-6 transition-colors duration-300 shadow-sm">
              <FaLaptopCode />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-[#6e4ef2] transition-colors">Candidate</h2>
            <p className="text-gray-500 font-medium leading-relaxed">
              I want to discover amazing companies, apply for jobs, and track my applications with AI.
            </p>
          </div>
        </div>

        {/* Recruiter Card */}
        <div 
          onClick={() => handleRoleSelection('recruiter')}
          className="bg-white p-10 rounded-[2rem] shadow-xl hover:shadow-2xl border-2 border-transparent hover:border-blue-500 transition-all duration-300 cursor-pointer transform hover:-translate-y-2 group flex flex-col items-center text-center relative overflow-hidden"
        >
          {/* Subtle background glow on hover */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-[#f5f6fa] group-hover:bg-blue-500 group-hover:text-white text-blue-500 flex items-center justify-center text-4xl mb-6 transition-colors duration-300 shadow-sm">
              <FaUserTie />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-blue-500 transition-colors">Recruiter</h2>
            <p className="text-gray-500 font-medium leading-relaxed">
              I want to post jobs, manage candidates, and use AI to find the perfect match for my team.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}