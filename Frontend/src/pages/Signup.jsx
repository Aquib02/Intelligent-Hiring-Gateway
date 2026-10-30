import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { setAuthSession } from '../utils/auth';
import { FaEnvelope, FaLock, FaSpinner, FaUserTie, FaLaptopCode, FaCheckCircle } from 'react-icons/fa';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('jobseeker'); // 'jobseeker' or 'recruiter'
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('role', role);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, formData);
      const { access_token, user_id, role: assignedRole } = response.data;

      setAuthSession({ access_token, user_id, role: assignedRole, email });

      alert('🎉 Account successfully created with Bcrypt encryption!');

      if (assignedRole === 'recruiter') {
        navigate('/recruiter/dashboard');
      } else {
        navigate('/jobseeker/dashboard');
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        alert(error.response.data.detail || 'Email already registered! Try a different one.');
      } else {
        alert('Signup failed! Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2ff] p-4 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-24 h-24 bg-[#6e4ef2] rounded-full mix-blend-multiply filter blur-xl opacity-50"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-white rounded-full mix-blend-multiply filter blur-xl opacity-50"></div>

      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl flex overflow-hidden z-10">
        
        {/* LEFT SIDE: Image/Graphic */}
        <div className="hidden md:flex w-1/2 bg-[#6e4ef2] relative items-center justify-center p-12 overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[120%] h-[120%] border-[40px] border-white opacity-5 rounded-[40%] animate-[spin_50s_linear_infinite]"></div>
          
          <div className="relative z-10 w-full max-w-sm h-full max-h-[500px] rounded-3xl border border-white/20 bg-white/10 backdrop-blur-sm shadow-2xl overflow-hidden flex items-end justify-center">
            <img 
              src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
              alt="Join Team" 
              className="w-full h-[90%] object-cover object-top"
            />
            <div className="absolute right-[-20px] top-1/4 bg-white w-12 h-12 rounded-full shadow-xl flex items-center justify-center z-20">
              <span className="text-blue-500 text-2xl">🚀</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Form */}
        <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-black text-gray-900 mb-2">CREATE ACCOUNT</h2>
            <p className="text-sm text-gray-500 font-medium">Select your portal role to continue</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            
            {/* Role Selection Switcher */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Account Type (RBAC)</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('jobseeker')}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition ${
                    role === 'jobseeker'
                      ? 'border-[#6e4ef2] bg-purple-50 text-[#6e4ef2] font-bold shadow-sm'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <FaLaptopCode className="text-xl" />
                  <span className="text-xs">Job Seeker</span>
                  {role === 'jobseeker' && <FaCheckCircle className="text-xs mt-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => setRole('recruiter')}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition ${
                    role === 'recruiter'
                      ? 'border-[#6e4ef2] bg-purple-50 text-[#6e4ef2] font-bold shadow-sm'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <FaUserTie className="text-xl" />
                  <span className="text-xs">Recruiter / HR</span>
                  {role === 'recruiter' && <FaCheckCircle className="text-xs mt-0.5" />}
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <FaEnvelope />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#f5f6fa] text-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#6e4ef2] transition text-sm" 
                placeholder="Email Address" 
                required 
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <FaLock />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#f5f6fa] text-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#6e4ef2] transition text-sm" 
                placeholder="Secure Password (Bcrypt Encrypted)" 
                required 
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#6e4ef2] text-white font-bold py-3 rounded-xl hover:bg-[#5a3edb] shadow-lg transition duration-300 flex justify-center items-center text-sm"
              >
                {loading ? <FaSpinner className="animate-spin mr-2" /> : "Sign Up & Get Started"}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600 font-medium">
            Already have an account? <Link to="/" className="text-[#6e4ef2] font-bold hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
