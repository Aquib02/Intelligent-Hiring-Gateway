import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useGoogleLogin } from '@react-oauth/google';
import { 
  FaRegUser, FaLock, FaSpinner, FaEye, FaEyeSlash, 
  FaLaptopCode, FaUserTie, FaCheckCircle, FaShieldAlt, 
  FaMagic, FaArrowRight, FaBolt, FaAward
} from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { API_BASE_URL } from '../config';
import { setAuthSession } from '../utils/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRolePreview, setSelectedRolePreview] = useState('jobseeker'); // 'jobseeker' | 'recruiter'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  // Common routing logic
  const handleRouting = (role) => {
    if (!role || role === "null") {
      navigate('/select-role');
    } else if (role === 'jobseeker' || role === 'employee') {
      navigate('/jobseeker/dashboard');
    } else if (role === 'recruiter') {
      navigate('/recruiter/dashboard');
    }
  };

  // Normal Email/Password Login
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Please enter your email address.');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('email', cleanEmail);
    formData.append('password', password);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, formData);
      const { access_token, user_id, role, name } = response.data;

      setAuthSession({ access_token, user_id, role, name, email: cleanEmail });
      handleRouting(role);
    } catch (error) {
      if (!error.response) {
        setErrorMsg(`Network Error: Cannot connect to Backend at ${API_BASE_URL}. If Render is waking up from sleep, please wait 30 seconds and try again, or check VITE_API_URL in Vercel.`);
      } else {
        setErrorMsg(error.response?.data?.detail || 'Invalid email or password. Please verify credentials or register.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Instant Demo Login (Uses robust /auth/demo-login with auto-provisioning)
  const quickLogin = async (roleType) => {
    setLoading(true);
    setErrorMsg('');

    const demoEmail = roleType === 'jobseeker' ? 'candidate.demo@gateway.ai' : 'recruiter.demo@gateway.ai';
    const demoPass = roleType === 'jobseeker' ? 'CandidatePass123!' : 'RecruiterPass123!';

    setEmail(demoEmail);
    setPassword(demoPass);
    setSelectedRolePreview(roleType);

    const formData = new FormData();
    formData.append('role', roleType);

    try {
      // First try dedicated demo endpoint
      let response;
      try {
        response = await axios.post(`${API_BASE_URL}/auth/demo-login`, formData);
      } catch (demoErr) {
        // Fallback to standard login endpoint with credentials
        const loginData = new FormData();
        loginData.append('email', demoEmail);
        loginData.append('password', demoPass);
        response = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
      }

      const { access_token, user_id, role, name } = response.data;
      setAuthSession({ access_token, user_id, role, name, email: demoEmail });
      handleRouting(role);
    } catch (error) {
      if (!error.response) {
        setErrorMsg(`Server unreachable at ${API_BASE_URL}. Render free tier backend may be sleeping (waking up takes ~30-40s) or VITE_API_URL is missing in Vercel. Please retry in a moment.`);
      } else {
        setErrorMsg(error.response?.data?.detail || 'Failed to authenticate demo account. Please try again or create an account.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Quick Fill Demo Credentials (For manual review before submit)
  const fillDemo = (roleType) => {
    setErrorMsg('');
    if (roleType === 'jobseeker') {
      setEmail('candidate.demo@gateway.ai');
      setPassword('CandidatePass123!');
      setSelectedRolePreview('jobseeker');
    } else {
      setEmail('recruiter.demo@gateway.ai');
      setPassword('RecruiterPass123!');
      setSelectedRolePreview('recruiter');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-purple-600 selection:text-white">
      
      {/* Background Animated Glow Spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Glassmorphic Card Container */}
      <div className="w-full max-w-5xl bg-slate-900/90 border border-slate-800/80 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col md:flex-row overflow-hidden z-10">
        
        {/* ==================================================== */}
        {/* LEFT SIDE: INTERACTIVE FORM & CONTROLS */}
        {/* ==================================================== */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          
          {/* Dual Navigation Switcher Tabs (Sign In / Sign Up) */}
          <div className="flex items-center gap-2 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl mb-6">
            <Link
              to="/login"
              className="flex-1 py-2 rounded-xl text-xs font-bold text-center bg-purple-600 text-white shadow-md shadow-purple-600/30 flex items-center justify-center gap-1.5 transition"
            >
              <FaLock className="text-xs" /> Sign In (Login)
            </Link>
            <Link
              to="/signup"
              className="flex-1 py-2 rounded-xl text-xs font-bold text-center text-slate-400 hover:text-white hover:bg-slate-900 transition flex items-center justify-center gap-1.5"
            >
              <FaRegUser className="text-xs" /> Sign Up (Register)
            </Link>
          </div>

          {/* Header */}
          <div className="mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold mb-2">
              <FaBolt className="text-amber-400" />
              <span>Next-Gen AI Recruitment Platform</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Sign In to Gateway</h2>
            <p className="text-xs text-slate-400 mt-1">
              Access your intelligent candidate portal or recruiter hiring workspace.
            </p>
          </div>

          {/* 1-Click Instant Demo Login (For seamless zero-typing evaluation) */}
          <div className="mb-5 p-3.5 bg-slate-950/90 border border-purple-500/20 rounded-2xl shadow-inner">
            <div className="flex items-center justify-between text-[11px] text-slate-300 mb-2 font-bold">
              <span className="flex items-center gap-1.5 text-purple-300">
                <FaBolt className="text-amber-400 text-xs" /> 1-Click Instant Demo Login:
              </span>
              <span className="text-[10px] text-slate-500 font-normal">Pre-seeded accounts</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickLogin('jobseeker')}
                disabled={loading}
                className="py-2 px-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 text-[11px] font-bold text-purple-200 transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
              >
                <FaLaptopCode className="text-purple-400" /> Job Seeker Demo
              </button>
              <button
                type="button"
                onClick={() => quickLogin('recruiter')}
                disabled={loading}
                className="py-2 px-3 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/40 text-[11px] font-bold text-indigo-200 transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
              >
                <FaUserTie className="text-blue-400" /> Recruiter Demo
              </button>
            </div>
          </div>

          {/* Error Message Toast */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-400 transition">
                  <FaRegUser className="text-xs" />
                </div>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl text-xs outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition font-medium" 
                  placeholder="name@company.com" 
                  required 
                />
              </div>
            </div>
            
            {/* Password Field with Eye Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <span className="text-[10px] text-purple-400 hover:underline cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-400 transition">
                  <FaLock className="text-xs" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl text-xs outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition font-medium" 
                  placeholder="Enter your password" 
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <FaEyeSlash className="text-xs" /> : <FaEye className="text-xs" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 transition duration-300 flex justify-center items-center gap-2 text-xs"
              >
                {loading ? <FaSpinner className="animate-spin text-sm" /> : <FaArrowRight className="text-xs" />}
                {loading ? "Authenticating with Bcrypt..." : "Sign In to Gateway"}
              </button>
            </div>
          </form>

          {/* Social Login Separator */}
          <div className="flex items-center my-5">
            <div className="flex-1 border-t border-slate-800"></div>
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Or continue with</span>
            <div className="flex-1 border-t border-slate-800"></div>
          </div>

          {/* Google Login Button */}
          <button 
            onClick={() => handleGoogleLogin()} 
            disabled={loading}
            type="button" 
            className="w-full flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-slate-300 font-bold py-2.5 rounded-xl transition text-xs shadow-sm hover:border-slate-700"
          >
            <FcGoogle className="text-base" /> Login with Google Workspace
          </button>

          {/* Link to Signup */}
          <p className="mt-6 text-center text-xs text-slate-400 font-medium">
            New to Intelligent Hiring Gateway?{' '}
            <Link to="/signup" className="text-purple-400 font-bold hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        {/* ==================================================== */}
        {/* RIGHT SIDE: INTERACTIVE AI FEATURE SHOWCASE */}
        {/* ==================================================== */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-purple-950/80 via-slate-900 to-indigo-950 p-10 flex-col justify-between border-l border-slate-800/80 relative overflow-hidden">
          
          {/* Subtle Decorative Pattern */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Role Preview Switcher */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2">Interactive Preview</div>
            <div className="flex items-center gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800 w-fit">
              <button
                type="button"
                onClick={() => setSelectedRolePreview('jobseeker')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedRolePreview === 'jobseeker'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FaLaptopCode /> Job Seeker Experience
              </button>
              <button
                type="button"
                onClick={() => setSelectedRolePreview('recruiter')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedRolePreview === 'recruiter'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FaUserTie /> Recruiter Experience
              </button>
            </div>
          </div>

          {/* Dynamic Interactive Card Content */}
          <div className="my-auto space-y-4">
            {selectedRolePreview === 'jobseeker' ? (
              <div className="space-y-3">
                <div className="p-4 bg-slate-950/80 border border-purple-500/30 rounded-2xl backdrop-blur-md shadow-xl transform hover:scale-[1.02] transition">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                      Live ATS Parser
                    </span>
                    <span className="text-xs font-black text-emerald-400">92% Match</span>
                  </div>
                  <p className="text-xs font-bold text-white">Full Stack AI Engineer at TechNova</p>
                  <p className="text-[11px] text-slate-400 mt-1">Verified Skills: Python, React, FastAPI, SQL, Docker</p>
                </div>

                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl backdrop-blur-md shadow-xl">
                  <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                    <FaMagic className="text-purple-400" /> AI Executive Cover Letter
                  </div>
                  <p className="text-[11px] text-slate-400">Generate 1-click tailored executive cover letters matching any job description.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-slate-950/80 border border-indigo-500/30 rounded-2xl backdrop-blur-md shadow-xl transform hover:scale-[1.02] transition">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                      Smart Pipeline
                    </span>
                    <span className="text-xs font-bold text-amber-400">Shortlisted ⭐</span>
                  </div>
                  <p className="text-xs font-bold text-white">Candidate Ranking & Filtering</p>
                  <p className="text-[11px] text-slate-400 mt-1">Filter top 5% candidates automatically sorted by ATS match scores.</p>
                </div>

                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl backdrop-blur-md shadow-xl">
                  <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                    <FaAward className="text-amber-400" /> AI Interview Prep Sheets
                  </div>
                  <p className="text-[11px] text-slate-400">Generate tailored behavioral and technical questions for candidates in 1-click.</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Security Badges */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <div className="flex items-center gap-1.5">
              <FaShieldAlt className="text-purple-400" />
              <span>Bcrypt Salt + JWT Encryption</span>
            </div>
            <span>MySQL 5.6+ InnoDB</span>
          </div>

        </div>

      </div>
    </div>
  );
}
