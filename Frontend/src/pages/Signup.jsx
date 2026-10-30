import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaEnvelope, FaLock, FaSpinner, FaUserTie, FaLaptopCode, 
  FaCheckCircle, FaEye, FaEyeSlash, FaShieldAlt, FaMagic, 
  FaArrowRight, FaCheck, FaTimes, FaBolt, FaStar, FaUser, FaRegUser
} from 'react-icons/fa';
import { API_BASE_URL } from '../config';
import { setAuthSession } from '../utils/auth';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('jobseeker'); // 'jobseeker' | 'recruiter'
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  // Password Strength Evaluator
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const strengthCount = [hasMinLength, hasNumber, hasUpper, hasSpecial].filter(Boolean).length;
  const strengthColor = strengthCount <= 1 ? 'bg-rose-500' :
                        strengthCount <= 3 ? 'bg-amber-500' : 'bg-emerald-500';
  const strengthLabel = strengthCount <= 1 ? 'Weak' :
                        strengthCount <= 3 ? 'Moderate' : 'Strong & Secure';

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg("Please enter a valid work or personal email address.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please verify.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('email', cleanEmail);
    formData.append('password', password);
    formData.append('role', role);
    if (name.trim()) {
      formData.append('name', name.trim());
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, formData);
      const { access_token, user_id, role: assignedRole, name: registeredName } = response.data;

      setAuthSession({ 
        access_token, 
        user_id, 
        role: assignedRole, 
        name: registeredName || name.trim() || cleanEmail.split('@')[0], 
        email: cleanEmail 
      });

      if (assignedRole === 'recruiter') {
        navigate('/recruiter/dashboard');
      } else {
        navigate('/jobseeker/dashboard');
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.detail || 'Registration failed. This email may already be registered. Try signing in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-purple-600 selection:text-white">
      
      {/* Background Animated Glow Spheres */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Glassmorphic Card Container */}
      <div className="w-full max-w-5xl bg-slate-900/90 border border-slate-800/80 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col md:flex-row overflow-hidden z-10">
        
        {/* ==================================================== */}
        {/* LEFT SIDE: INTERACTIVE VALUE SHOWCASE */}
        {/* ==================================================== */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-purple-950/80 via-slate-900 to-indigo-950 p-10 flex-col justify-between border-r border-slate-800/80 relative overflow-hidden">
          
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold mb-3">
              <FaBolt className="text-amber-400" />
              <span>Zero-Setup Onboarding</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Create Your Account</h1>
            <p className="text-xs text-slate-400 mt-1">
              Join thousands of professionals & recruiters using neural ATS scoring.
            </p>
          </div>

          {/* Interactive Role Benefits Showcase */}
          <div className="my-auto space-y-4">
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl backdrop-blur-md shadow-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1 block">
                {role === 'jobseeker' ? 'Candidate Superpowers' : 'Recruitment Superpowers'}
              </span>
              
              {role === 'jobseeker' ? (
                <ul className="text-xs text-slate-300 space-y-2.5 mt-2">
                  <li className="flex items-center gap-2">
                    <FaCheckCircle className="text-emerald-400 text-sm flex-shrink-0" />
                    <span>Instant AI Resume Parsing & ATS Compatibility Audit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FaCheckCircle className="text-emerald-400 text-sm flex-shrink-0" />
                    <span>Live Application Funnel & Recruiter Review Tracker</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FaCheckCircle className="text-emerald-400 text-sm flex-shrink-0" />
                    <span>1-Click AI Executive Cover Letter Generator</span>
                  </li>
                </ul>
              ) : (
                <ul className="text-xs text-slate-300 space-y-2.5 mt-2">
                  <li className="flex items-center gap-2">
                    <FaCheckCircle className="text-indigo-400 text-sm flex-shrink-0" />
                    <span>Auto-Rank Candidates by Neural ATS Score (Top 5%)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FaCheckCircle className="text-indigo-400 text-sm flex-shrink-0" />
                    <span>Platform Talent Pool Search & Verified Resume Access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FaCheckCircle className="text-indigo-400 text-sm flex-shrink-0" />
                    <span>AI-Generated Customized Interview Prep Sheets</span>
                  </li>
                </ul>
              )}
            </div>

            <div className="p-4 bg-purple-950/30 border border-purple-500/20 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center text-lg flex-shrink-0">
                <FaStar className="text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Strict Role-Based Security</p>
                <p className="text-[11px] text-slate-400">Recruiters and Candidates operate in completely isolated environments.</p>
              </div>
            </div>
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

        {/* ==================================================== */}
        {/* RIGHT SIDE: INTERACTIVE SIGNUP FORM */}
        {/* ==================================================== */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          
          {/* Dual Navigation Switcher Tabs (Sign In / Sign Up) */}
          <div className="flex items-center gap-2 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl mb-6">
            <Link
              to="/login"
              className="flex-1 py-2 rounded-xl text-xs font-bold text-center text-slate-400 hover:text-white hover:bg-slate-900 transition flex items-center justify-center gap-1.5"
            >
              <FaLock className="text-xs" /> Sign In (Login)
            </Link>
            <Link
              to="/signup"
              className="flex-1 py-2 rounded-xl text-xs font-bold text-center bg-purple-600 text-white shadow-md shadow-purple-600/30 flex items-center justify-center gap-1.5 transition"
            >
              <FaRegUser className="text-xs" /> Sign Up (Register)
            </Link>
          </div>

          <div className="mb-5">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Create Your Account</h2>
            <p className="text-xs text-slate-400 mt-1">
              Select your role to activate your intelligent AI workspace.
            </p>
          </div>

          {/* Interactive Role Switcher Cards */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={() => setRole('jobseeker')}
              className={`p-3.5 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition text-center ${
                role === 'jobseeker'
                  ? 'border-purple-500 bg-purple-950/40 text-purple-300 font-bold shadow-lg shadow-purple-950/50'
                  : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
              }`}
            >
              <FaLaptopCode className={`text-xl ${role === 'jobseeker' ? 'text-purple-400' : 'text-slate-500'}`} />
              <span className="text-xs font-bold text-white">Job Seeker</span>
              <span className="text-[10px] text-slate-400">Apply & ATS Scan</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('recruiter')}
              className={`p-3.5 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition text-center ${
                role === 'recruiter'
                  ? 'border-purple-500 bg-purple-950/40 text-purple-300 font-bold shadow-lg shadow-purple-950/50'
                  : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
              }`}
            >
              <FaUserTie className={`text-xl ${role === 'recruiter' ? 'text-purple-400' : 'text-slate-500'}`} />
              <span className="text-xs font-bold text-white">Recruiter / HR</span>
              <span className="text-[10px] text-slate-400">Post & Rank Talent</span>
            </button>
          </div>

          {/* Error Message Toast */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-3.5">
            
            {/* Full Name Field */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Full Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-400 transition">
                  <FaUser className="text-xs" />
                </div>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl text-xs outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition font-medium" 
                  placeholder={role === 'jobseeker' ? "e.g. Aman Sharma" : "e.g. Priya Verma"} 
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Work or Personal Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-400 transition">
                  <FaEnvelope className="text-xs" />
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

            {/* Password Field with Strength Meter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-400 transition">
                  <FaLock className="text-xs" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl text-xs outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition font-medium" 
                  placeholder="Create a strong password" 
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

              {/* Interactive Strength Meter */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Password Security:</span>
                    <span className={`font-bold ${strengthCount >= 3 ? 'text-emerald-400' : strengthCount >= 2 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {strengthLabel}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden flex gap-1">
                    <div className={`h-full flex-1 rounded-full ${strengthCount >= 1 ? strengthColor : 'bg-slate-800'}`}></div>
                    <div className={`h-full flex-1 rounded-full ${strengthCount >= 2 ? strengthColor : 'bg-slate-800'}`}></div>
                    <div className={`h-full flex-1 rounded-full ${strengthCount >= 3 ? strengthColor : 'bg-slate-800'}`}></div>
                    <div className={`h-full flex-1 rounded-full ${strengthCount >= 4 ? strengthColor : 'bg-slate-800'}`}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Confirm Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-400 transition">
                  <FaLock className="text-xs" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl text-xs outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition font-medium" 
                  placeholder="Repeat your password" 
                  required 
                />
                {confirmPassword.length > 0 && (
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                    {passwordsMatch ? (
                      <FaCheck className="text-emerald-400 text-xs" />
                    ) : (
                      <FaTimes className="text-rose-400 text-xs" />
                    )}
                  </div>
                )}
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
                {loading ? "Creating Encrypted Account..." : "Create Account & Enter Portal"}
              </button>
            </div>
          </form>

          {/* Link to Login */}
          <p className="mt-6 text-center text-xs text-slate-400 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-400 font-bold hover:underline">
              Sign in now (Login)
            </Link>
          </p>

        </div>

      </div>
    </div>
  );
}
