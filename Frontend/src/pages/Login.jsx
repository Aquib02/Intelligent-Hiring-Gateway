import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useGoogleLogin } from '@react-oauth/google';
import { FaRegUser, FaLock, FaFacebook, FaSpinner } from 'react-icons/fa'; // FaSpinner add kiya
import { FcGoogle } from 'react-icons/fc';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // Loading state
  const navigate = useNavigate();

  // --- COMMON ROUTING LOGIC ---
  const handleRouting = (role, is_profile_complete) => {
    if (!role || role === "null") {
      navigate('/select-role');
    } else if (role === 'employee') {
      is_profile_complete ? navigate('/employee/dashboard') : navigate('/employee/profile');
    } else if (role === 'recruiter') {
      navigate('/recruiter/dashboard');
    }
  };

  // --- NORMAL EMAIL LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    try {
      const response = await axios.post('https://intelligent-hiring-gateway.onrender.com/auth/login', formData);
      const { user_id, role, is_profile_complete } = response.data; 
      
      localStorage.setItem('user_id', user_id);
      if (role) localStorage.setItem('role', role);

      handleRouting(role, is_profile_complete);
    } catch (error) {
      alert(error.response?.status === 400 ? 'Invalid email or password' : 'Login failed!');
    } finally {
      setLoading(false);
    }
  };

  // --- UPDATED GOOGLE LOGIN ---
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        // 1. Google se user data lana
        const userInfo = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );
        
        // 2. Apne backend ko bhejna
        const response = await axios.post('https://intelligent-hiring-gateway.onrender.com/auth/google', {
          email: userInfo.data.email,
          name: userInfo.data.name
        });

        const { user_id, role, is_profile_complete } = response.data;
        localStorage.setItem('user_id', user_id);
        if (role) localStorage.setItem('role', role);

        handleRouting(role, is_profile_complete);
      } catch (error) {
        console.error("Google Auth Error:", error);
        alert("Google Login Failed!");
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2ff] p-4 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-24 h-24 bg-[#6e4ef2] rounded-full mix-blend-multiply filter blur-xl opacity-50"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-white rounded-full mix-blend-multiply filter blur-xl opacity-50"></div>

      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl flex overflow-hidden z-10">
        
        {/* LEFT SIDE: Form */}
        <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-gray-900 mb-2">LOGIN</h2>
            <p className="text-sm text-gray-500 font-medium">Get started with your AI career portal</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <FaRegUser />
              </div>
              <input 
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#f5f6fa] text-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#6e4ef2] transition" 
                placeholder="Username or Email" required 
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <FaLock />
              </div>
              <input 
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#f5f6fa] text-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#6e4ef2] transition" 
                placeholder="Password" required 
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit" disabled={loading}
                className="w-full bg-[#6e4ef2] text-white font-bold py-3 rounded-xl hover:bg-[#5a3edb] shadow-lg transition duration-300 flex justify-center items-center"
              >
                {loading ? <FaSpinner className="animate-spin mr-2" /> : "Login Now"}
              </button>
            </div>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-3 text-sm text-gray-400 font-medium">Login with Others</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => handleGoogleLogin()} 
              disabled={loading}
              type="button" 
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition"
            >
              <FcGoogle className="text-xl" /> Login with Google
            </button>
            <button 
              type="button" 
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition"
            >
              <FaFacebook className="text-blue-600 text-xl" /> Login with Facebook
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-gray-600 font-medium">
            Don't have an account? <Link to="/signup" className="text-[#6e4ef2] hover:underline">Sign up</Link>
          </p>
        </div>

        {/* RIGHT SIDE: Graphic (Same design) */}
        <div className="hidden md:flex w-1/2 bg-[#6e4ef2] relative items-center justify-center p-12 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] border-[40px] border-white opacity-5 rounded-[40%] animate-[spin_60s_linear_infinite]"></div>
          <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] border-[20px] border-white opacity-5 rounded-[30%] animate-[spin_80s_linear_infinite_reverse]"></div>
          <div className="relative z-10 w-full max-w-sm h-full max-h-[500px] rounded-3xl border border-white/20 bg-white/10 backdrop-blur-sm shadow-2xl overflow-hidden flex items-end justify-center">
            <img 
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
              alt="Professional" className="w-full h-[90%] object-cover object-top"
            />
            <div className="absolute left-[-20px] top-1/2 transform -translate-y-1/2 bg-white w-12 h-12 rounded-full shadow-xl flex items-center justify-center z-20">
              <span className="text-yellow-500 text-2xl">⚡</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}