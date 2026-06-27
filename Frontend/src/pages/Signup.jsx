import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaEnvelope, FaLock, FaSpinner, FaArrowRight } from 'react-icons/fa';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    try {
      await axios.post('https://intelligent-hiring-gateway.onrender.com/auth/register', formData);
      alert('Account successfully created! Please log in.');
      navigate('/'); 
    } catch (error) {
      if (error.response && error.response.status === 400) {
        alert('Email already registered! Try a different one.');
      } else {
        alert('Signup failed! Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2ff] p-4 relative overflow-hidden">
      
      {/* Decorative Circles (Login se matching) */}
      <div className="absolute top-10 left-10 w-24 h-24 bg-[#6e4ef2] rounded-full mix-blend-multiply filter blur-xl opacity-50"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-white rounded-full mix-blend-multiply filter blur-xl opacity-50"></div>

      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl flex overflow-hidden z-10">
        
        {/* LEFT SIDE: Image/Graphic (Login ka Mirror) */}
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

        {/* RIGHT SIDE: Signup Form */}
        <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center bg-white">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">CREATE ACCOUNT</h2>
            <p className="text-sm text-gray-500 font-medium tracking-wide">Start your journey with AI-powered hiring.</p>
          </div>
          
          <form onSubmit={handleSignup} className="space-y-6">
            {/* Email Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <FaEnvelope />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-[#f5f6fa] text-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#6e4ef2] transition-all font-medium border-none" 
                placeholder="Enter your email"
                required 
              />
            </div>
            
            {/* Password Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <FaLock />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-[#f5f6fa] text-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#6e4ef2] transition-all font-medium border-none" 
                placeholder="Create a password"
                required 
              />
            </div>

            {/* Signup Button */}
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#6e4ef2] text-white font-bold py-4 rounded-xl hover:bg-[#5a3edb] shadow-lg hover:shadow-xl transition-all duration-300 flex justify-center items-center gap-2 group"
              >
                {loading ? <FaSpinner className="animate-spin text-xl" /> : (
                  <>
                    Sign Up <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600 font-medium">
            Already have an account? <Link to="/" className="text-[#6e4ef2] font-bold hover:underline ml-1">Log in here</Link>
          </p>
        </div>

      </div>
    </div>
  );
}