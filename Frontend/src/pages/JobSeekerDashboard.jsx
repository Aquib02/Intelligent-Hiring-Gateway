import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaBriefcase, FaMagic, FaCheckCircle, FaRegLightbulb, 
  FaSpinner, FaUserCircle, FaSignOutAlt, FaSearch, 
  FaFilePdf, FaAward, FaBuilding, FaMapMarkerAlt, 
  FaExclamationTriangle, FaCloudUploadAlt, FaLaptopCode,
  FaBars, FaTimes, FaCog, FaHistory, FaCheck, FaExternalLinkAlt,
  FaGithub, FaLinkedin, FaGlobe, FaChevronRight, FaStar,
  FaBookmark, FaRegBookmark, FaChartLine, FaEye, FaCopy, FaEnvelopeOpenText
} from 'react-icons/fa';
import { MdOutlineWorkOutline, MdDashboard, MdAnalytics, MdTrendingUp } from 'react-icons/md';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, Tooltip, RadarChart, Radar, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell 
} from 'recharts';
import { API_BASE_URL } from '../config';
import { clearAuthSession, getAuthUser } from '../utils/auth';

export default function JobSeekerDashboard() {
  const navigate = useNavigate();
  const user = getAuthUser();
  const employeeId = user.userId || localStorage.getItem('user_id');

  // Active View Navigation: 'analytics' | 'jobs' | 'resume' | 'applications' | 'saved' | 'profile'
  const [activeView, setActiveView] = useState('analytics');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Data States
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  // Application & ATS Matching States
  const [applyingId, setApplyingId] = useState(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [evaluatingJob, setEvaluatingJob] = useState(null);

  // AI Cover Letter Modal
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false);
  const [coverLetterText, setCoverLetterText] = useState('');
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [selectedLetterJob, setSelectedLetterJob] = useState(null);

  // Resume Upload State
  const [uploadingResume, setUploadingResume] = useState(false);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    address: '',
    education: '',
    gender: 'Male',
    mobile: '',
    experience: '',
    current_role: '',
    preferred_role: '',
    skills_manual: '',
    preferred_location: '',
    job_type: 'Full-time',
    expected_salary: '',
    availability: 'Immediate',
    github: '',
    linkedin: '',
    portfolio: '',
    projects: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (employeeId) {
      fetchProfile();
      fetchJobs();
      fetchMyApplications();
      fetchSavedJobs();
      fetchAnalytics();
    }
  }, [employeeId]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/user/${employeeId}`);
      setUserProfile(res.data);
      if (res.data) {
        setProfileForm({
          name: res.data.name || '',
          address: res.data.address || '',
          education: res.data.education || '',
          gender: res.data.gender || 'Male',
          mobile: res.data.mobile || '',
          experience: res.data.experience || '',
          current_role: res.data.current_role || '',
          preferred_role: res.data.preferred_role || '',
          skills_manual: res.data.skills_manual || '',
          preferred_location: res.data.preferred_location || '',
          job_type: res.data.job_type || 'Full-time',
          expected_salary: res.data.expected_salary || '',
          availability: res.data.availability || 'Immediate',
          github: res.data.github || '',
          linkedin: res.data.linkedin || '',
          portfolio: res.data.portfolio || '',
          projects: res.data.projects || ''
        });
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/jobs`);
      setJobs(res.data);
    } catch (err) {
      console.error("Jobs fetch error:", err);
    }
  };

  const fetchMyApplications = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/employee/${employeeId}/applications`);
      setApplications(res.data);
    } catch (err) {
      console.error("Applications fetch error:", err);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/employee/${employeeId}/saved-jobs`);
      setSavedJobs(res.data);
    } catch (err) {
      console.error("Saved jobs fetch error:", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/employee/${employeeId}/analytics`);
      setAnalyticsData(res.data);
    } catch (err) {
      console.error("Analytics fetch error:", err);
    }
  };

  const handleApply = async (jobId) => {
    if (!userProfile?.resume_path) {
      alert("⚠️ Please upload your resume first! Switching to AI Resume Scanner.");
      setActiveView('resume');
      return;
    }

    setApplyingId(jobId);
    const formData = new FormData();
    formData.append('job_id', jobId);
    formData.append('employee_id', employeeId);

    try {
      const res = await axios.post(`${API_BASE_URL}/employee/apply`, formData);
      alert(`🎉 Application Submitted! Your AI ATS Match Score: ${res.data.ats_score}%`);
      fetchMyApplications();
      fetchAnalytics();
    } catch (error) {
      alert(error.response?.data?.detail || "Application failed. You may have already applied.");
    } finally {
      setApplyingId(null);
    }
  };

  const handleCheckMatch = async (job) => {
    if (!userProfile?.resume_path) {
      alert("⚠️ Please upload your resume first to run AI ATS scoring!");
      setActiveView('resume');
      return;
    }

    setEvaluatingJob(job);
    setShowMatchModal(true);
    setLoadingMatch(true);
    setSelectedMatch(null);

    try {
      const res = await axios.get(
        `${API_BASE_URL}/match-score?job_id=${job.id}&employee_id=${employeeId}`
      );
      setSelectedMatch(res.data);
    } catch (error) {
      console.error("Match error:", error);
      setSelectedMatch({ error: "Failed to evaluate ATS score. Please try again." });
    } finally {
      setLoadingMatch(false);
    }
  };

  const handleToggleSaveJob = async (jobId) => {
    const isSaved = savedJobs.some(s => s.job_id === jobId);
    try {
      if (isSaved) {
        await axios.delete(`${API_BASE_URL}/employee/saved-jobs/${jobId}?employee_id=${employeeId}`);
        setSavedJobs(prev => prev.filter(s => s.job_id !== jobId));
      } else {
        const formData = new FormData();
        formData.append('employee_id', employeeId);
        formData.append('job_id', jobId);
        await axios.post(`${API_BASE_URL}/employee/saved-jobs`, formData);
        fetchSavedJobs();
      }
    } catch (err) {
      alert("Failed to update saved job.");
    }
  };

  const handleGenerateCoverLetter = async (job) => {
    setSelectedLetterJob(job);
    setShowCoverLetterModal(true);
    setGeneratingLetter(true);
    setCoverLetterText('');

    const formData = new FormData();
    formData.append('job_id', job.id);
    formData.append('employee_id', employeeId);

    try {
      const res = await axios.post(`${API_BASE_URL}/ai/generate-cover-letter`, formData);
      setCoverLetterText(res.data.cover_letter);
    } catch (err) {
      setCoverLetterText("Could not generate cover letter at this time. Please try again.");
    } finally {
      setGeneratingLetter(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert("Please upload a PDF file for accurate AI ATS scanning.");
      return;
    }

    setUploadingResume(true);
    const formData = new FormData();
    formData.append('user_id', employeeId);
    formData.append('resume', file);

    try {
      const res = await axios.post(`${API_BASE_URL}/employee/upload-resume`, formData);
      alert("✨ Resume uploaded & AI skills parsed successfully!");
      fetchProfile();
      fetchAnalytics();
    } catch (err) {
      alert("Resume upload failed. Please try again.");
    } finally {
      setUploadingResume(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    const formData = new FormData();
    formData.append('user_id', employeeId);
    Object.keys(profileForm).forEach(k => {
      formData.append(k, profileForm[k]);
    });

    try {
      await axios.post(`${API_BASE_URL}/employee/profile`, formData);
      alert("✅ Profile updated successfully!");
      fetchProfile();
      fetchAnalytics();
    } catch (err) {
      alert("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate('/');
  };

  const appliedJobIds = new Set(applications.map(a => a.job_id));
  const savedJobIds = new Set(savedJobs.map(s => s.job_id));

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (job.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (job.skills || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = jobTypeFilter === 'all' || job.job_type === jobTypeFilter;
    const matchesLocation = locationFilter === 'all' || 
                            (locationFilter === 'Remote' && (job.location || '').toLowerCase().includes('remote')) ||
                            (locationFilter !== 'Remote' && !(job.location || '').toLowerCase().includes('remote'));
    return matchesSearch && matchesType && matchesLocation;
  });

  // Funnel chart data formatting
  const funnelData = analyticsData?.stage_funnel ? [
    { name: 'Applied', value: analyticsData.stage_funnel.Applied || 0, fill: '#3b82f6' },
    { name: 'Screening', value: analyticsData.stage_funnel.Screening || 0, fill: '#8b5cf6' },
    { name: 'Shortlisted', value: analyticsData.stage_funnel.Shortlisted || 0, fill: '#f59e0b' },
    { name: 'Interview', value: analyticsData.stage_funnel.Interview || 0, fill: '#10b981' },
    { name: 'Offered', value: analyticsData.stage_funnel.Offered || 0, fill: '#22c55e' },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans selection:bg-purple-600 selection:text-white">

      {/* MOBILE TOPBAR */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-sm">
            IHG
          </div>
          <span className="font-black text-sm tracking-tight text-white">SMART PORTAL</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-slate-300 p-2 rounded-lg bg-slate-800"
        >
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* ==================================================== */}
      {/* 1. ENTERPRISE SIDEBAR NAVIGATION PANEL */}
      {/* ==================================================== */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-72 bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between z-40 transition-transform duration-300
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-600/30 font-black text-lg">
              <FaLaptopCode />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white leading-none">
                IHG ENTERPRISE
              </h1>
              <p className="text-[11px] text-purple-400 font-semibold tracking-wide mt-1">
                AI Career Intelligence
              </p>
            </div>
          </div>

          {/* User Mini Profile Card */}
          <div className="p-4 mx-4 my-4 bg-slate-950/70 border border-slate-800 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-inner">
                {(userProfile?.name || user.email || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {userProfile?.name || user.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-purple-400 font-medium truncate">
                  {userProfile?.current_role || 'Candidate'}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${userProfile?.resume_path ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {userProfile?.resume_path ? 'Resume Live' : 'Upload Resume'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Left Navigation Menu Links */}
          <nav className="px-3 space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Navigation Suite
            </div>

            {/* Performance Analytics */}
            <button
              onClick={() => { setActiveView('analytics'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeView === 'analytics'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FaChartLine className="text-base text-purple-400" />
                <span>Performance & Charts</span>
              </div>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">
                {analyticsData?.profile_strength || 0}%
              </span>
            </button>

            {/* Explore Jobs */}
            <button
              onClick={() => { setActiveView('jobs'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeView === 'jobs'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MdOutlineWorkOutline className="text-base" />
                <span>Explore Jobs</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeView === 'jobs' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {jobs.length}
              </span>
            </button>

            {/* AI Resume & ATS Audit */}
            <button
              onClick={() => { setActiveView('resume'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeView === 'resume'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FaMagic className="text-base text-purple-400" />
                <span>AI Resume & ATS Audit</span>
              </div>
              {userProfile?.resume_path && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                  Active
                </span>
              )}
            </button>

            {/* Applications Tracker */}
            <button
              onClick={() => { setActiveView('applications'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeView === 'applications'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FaHistory className="text-base" />
                <span>My Applications</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeView === 'applications' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {applications.length}
              </span>
            </button>

            {/* Saved Jobs */}
            <button
              onClick={() => { setActiveView('saved'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeView === 'saved'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FaBookmark className="text-base text-amber-400" />
                <span>Saved Jobs</span>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                {savedJobs.length}
              </span>
            </button>

            {/* Profile & Target Settings */}
            <button
              onClick={() => { setActiveView('profile'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeView === 'profile'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FaCog className="text-base" />
                <span>Profile & Preferences</span>
              </div>
              <FaChevronRight className="text-[10px] opacity-40" />
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <div className="p-3 bg-purple-950/30 border border-purple-500/20 rounded-xl text-[11px] text-purple-300 flex items-center gap-2">
            <FaStar className="text-amber-400 flex-shrink-0" />
            <span>AI ATS Rank Engine: Live</span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 text-xs font-bold transition"
          >
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </aside>

      {/* ==================================================== */}
      {/* 2. MAIN CONTENT AREA */}
      {/* ==================================================== */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen">

        {/* VIEW 1: PERFORMANCE & VISUAL CHARTS (CANDIDATE INTELLIGENCE) */}
        {activeView === 'analytics' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Profile Strength</span>
                  <FaAward className="text-purple-400 text-base" />
                </div>
                <div className="text-3xl font-black text-white">{analyticsData?.profile_strength || 0}%</div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${analyticsData?.profile_strength || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Applications Sent</span>
                  <FaBriefcase className="text-blue-400 text-base" />
                </div>
                <div className="text-3xl font-black text-white">{analyticsData?.total_applications || 0}</div>
                <div className="text-[10px] text-slate-500 mt-1">In active recruiter pipelines</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Average ATS Score</span>
                  <FaMagic className="text-emerald-400 text-base" />
                </div>
                <div className="text-3xl font-black text-emerald-400">{analyticsData?.average_ats_score || 0}%</div>
                <div className="text-[10px] text-slate-500 mt-1">AI semantic match rating</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Weekly Search Impressions</span>
                  <FaEye className="text-amber-400 text-base" />
                </div>
                <div className="text-3xl font-black text-amber-400">153</div>
                <div className="text-[10px] text-slate-500 mt-1">Recruiter profile views</div>
              </div>
            </div>

            {/* Charts Row 1: Profile Impressions & ATS Score Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Recruiter Views Trend (Area Chart) */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <MdTrendingUp className="text-purple-400 text-lg" /> Profile Impressions Trend (7 Days)
                    </h3>
                    <p className="text-[11px] text-slate-400">Recruiters viewing your ATS profile keywords</p>
                  </div>
                  <span className="text-xs bg-purple-500/20 text-purple-300 font-bold px-2.5 py-1 rounded-full border border-purple-500/30">
                    +24% this week
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData?.views_trend || []}>
                      <defs>
                        <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                      <Area type="monotone" dataKey="views" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#viewsGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Application Funnel Chart */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <MdAnalytics className="text-indigo-400 text-lg" /> Application Funnel
                  </h3>
                  <p className="text-[11px] text-slate-400">Candidate progression through hiring stages</p>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData} layout="vertical">
                      <XAxis type="number" stroke="#64748b" fontSize={11} />
                      <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={80} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                        {funnelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Charts Row 2: Skills Radar & Profile Checklist */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Radar Chart: Skills vs Market Demand */}
              <div className="lg:col-span-6 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <FaMagic className="text-purple-400 text-base" /> Skills Market Competitiveness
                  </h3>
                  <p className="text-[11px] text-slate-400">Your skills index vs high-paying recruiter requirements</p>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analyticsData?.skills_fit || []}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="skill" stroke="#94a3b8" fontSize={10} />
                      <PolarRadiusAxis stroke="#475569" fontSize={9} />
                      <Radar name="Your Competency" dataKey="candidate" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                      <Radar name="Market Demand" dataKey="market_demand" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.2} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Profile Strength Checklist */}
              <div className="lg:col-span-6 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-black text-white">Profile Optimization Checklist</h3>
                    <p className="text-[11px] text-slate-400">Complete items to rank in top 5% on Naukri/Indeed style search</p>
                  </div>
                  <span className="text-xs font-black text-purple-400">{analyticsData?.profile_strength || 0}% / 100%</span>
                </div>

                <div className="space-y-2.5">
                  {(analyticsData?.checklist || []).map((item, idx) => (
                    <div 
                      key={idx}
                      className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        {item.completed ? (
                          <FaCheckCircle className="text-emerald-400 text-sm flex-shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-600 flex-shrink-0"></div>
                        )}
                        <span className={item.completed ? 'text-slate-200 font-semibold' : 'text-slate-400'}>
                          {item.item}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        item.completed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                      }`}>
                        +{item.points}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* VIEW 2: EXPLORE & MATCH JOBS */}
        {activeView === 'jobs' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Explore & Match Requisitions</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Jobs ranked in real-time by AI against your uploaded resume profile.
                </p>
              </div>

              {!userProfile?.resume_path && (
                <button
                  onClick={() => setActiveView('resume')}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 self-start"
                >
                  <FaExclamationTriangle /> Upload Resume for Match Score
                </button>
              )}
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2 relative">
                <FaSearch className="absolute left-3.5 top-3.5 text-slate-500 text-xs" />
                <input
                  type="text"
                  placeholder="Search by job title, company, or stack (e.g. React, Python, Cloud)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <select
                value={jobTypeFilter}
                onChange={(e) => setJobTypeFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl text-xs px-3 py-2.5 text-slate-200 outline-none focus:border-purple-500"
              >
                <option value="all">All Employment Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Remote">Remote</option>
                <option value="Contract">Contract</option>
                <option value="Hybrid">Hybrid</option>
              </select>

              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl text-xs px-3 py-2.5 text-slate-200 outline-none focus:border-purple-500"
              >
                <option value="all">All Locations</option>
                <option value="Remote">Remote Only</option>
                <option value="Onsite">Onsite / Hybrid</option>
              </select>
            </div>

            {/* Jobs List */}
            {filteredJobs.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center text-slate-500">
                <FaBriefcase className="text-3xl mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-semibold">No open positions matching your search criteria.</p>
                <p className="text-xs text-slate-600 mt-1">Try clearing your filters or check back later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredJobs.map((job) => {
                  const isApplied = appliedJobIds.has(job.id);
                  const isSaved = savedJobIds.has(job.id);

                  return (
                    <div
                      key={job.id}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition shadow-sm relative group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-white text-base leading-snug">{job.title}</h3>
                          <button
                            onClick={() => handleToggleSaveJob(job.id)}
                            className="text-slate-400 hover:text-amber-400 text-sm p-1 transition"
                            title={isSaved ? "Saved" : "Save Job"}
                          >
                            {isSaved ? <FaBookmark className="text-amber-400" /> : <FaRegBookmark />}
                          </button>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                          <span className="flex items-center gap-1"><FaBuilding className="text-slate-500" /> {job.company || 'Tech Corp'}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><FaMapMarkerAlt className="text-slate-500" /> {job.location || 'Remote'}</span>
                        </div>

                        <div className="text-[11px] font-bold text-emerald-400 mb-3">
                          {job.salary_range || 'Competitive Compensation'}
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                          {job.description}
                        </p>

                        {job.skills && (
                          <div className="flex flex-wrap gap-1.5 mb-5">
                            {job.skills.split(',').slice(0, 4).map((skill, idx) => (
                              <span key={idx} className="text-[10px] bg-slate-950 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-medium">
                                {skill.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-4 border-t border-slate-800/80 space-y-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCheckMatch(job)}
                            className="flex-1 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                          >
                            <FaMagic className="text-purple-400" /> ATS Pre-Check
                          </button>

                          <button
                            onClick={() => handleGenerateCoverLetter(job)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1"
                            title="Generate AI Cover Letter"
                          >
                            <FaEnvelopeOpenText className="text-purple-400" /> Cover Letter
                          </button>
                        </div>

                        {isApplied ? (
                          <button
                            disabled
                            className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-default"
                          >
                            <FaCheckCircle /> Applied to Position
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApply(job.id)}
                            disabled={applyingId === job.id}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-2 rounded-xl text-xs font-bold transition shadow-md shadow-purple-600/30"
                          >
                            {applyingId === job.id ? <FaSpinner className="animate-spin" /> : "1-Click Apply with ATS"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: AI RESUME SCANNER & ATS AUDIT */}
        {activeView === 'resume' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">AI Resume Scanner & ATS Optimizer</h2>
              <p className="text-xs text-slate-400 mt-1">
                Google Gemini AI parses your technical skills, experience metrics, and optimizes your profile for recruiter visibility.
              </p>
            </div>

            {/* Resume Upload Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center text-3xl mx-auto border border-purple-500/30">
                <FaCloudUploadAlt />
              </div>

              <div>
                <h3 className="text-lg font-black text-white">Upload Your Resume (PDF)</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Our neural parser automatically indexes your skills so recruiters can match and score your profile accurately.
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <input
                  type="file"
                  id="resumeUploadInput"
                  accept="application/pdf"
                  onChange={handleResumeUpload}
                  className="hidden"
                />
                <label
                  htmlFor="resumeUploadInput"
                  className={`inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl text-xs font-bold cursor-pointer transition ${
                    uploadingResume
                      ? 'bg-purple-800 text-slate-300'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30'
                  }`}
                >
                  {uploadingResume ? <FaSpinner className="animate-spin" /> : <FaCloudUploadAlt className="text-base" />}
                  {uploadingResume ? "Scanning Resume with AI..." : "Select & Upload Resume PDF"}
                </label>
              </div>

              {userProfile?.resume_path && (
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-center gap-3">
                  <span className="text-xs text-slate-400">Current Resume:</span>
                  <a
                    href={`${API_BASE_URL}/resumes/${userProfile.resume_path.replace('resumes/', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1.5 underline"
                  >
                    <FaFilePdf className="text-red-400" /> View Uploaded PDF
                  </a>
                </div>
              )}
            </div>

            {/* Extracted Skills Cloud */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-black text-white">Skills Indexed by AI ATS</h3>
                  <p className="text-xs text-slate-400">These keywords are cross-referenced against recruiter job postings.</p>
                </div>
                <span className="text-xs bg-purple-500/20 text-purple-300 font-bold px-3 py-1 rounded-full border border-purple-500/30">
                  {userProfile?.skills ? userProfile.skills.split(',').length : 0} Keywords
                </span>
              </div>

              {userProfile?.skills ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {userProfile.skills.split(',').map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-slate-950 border border-slate-800 text-purple-300 font-semibold text-xs px-3 py-1.5 rounded-xl"
                    >
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Upload a resume above to have AI extract and display your professional skill stack.
                </div>
              )}
            </div>

            {/* ATS Optimization Guide */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <FaRegLightbulb /> How Recruiter ATS Scoring Works
              </h3>
              <ul className="text-xs text-slate-400 space-y-2 list-disc pl-5 leading-relaxed">
                <li><strong className="text-white">Direct Keyword Frequency:</strong> Jobs match skills found verbatim in your resume (e.g. "React.js", "Docker", "SQL").</li>
                <li><strong className="text-white">Impact Quantifiers:</strong> Recruiters rate profiles higher when projects include metrics (e.g. "Reduced latency by 35%").</li>
                <li><strong className="text-white">Standard Structure:</strong> Keep sections clearly labeled (Summary, Experience, Projects, Skills, Education).</li>
              </ul>
            </div>

          </div>
        )}

        {/* VIEW 4: MY APPLICATIONS PIPELINE TRACKER */}
        {activeView === 'applications' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Application Pipeline Tracker</h2>
              <p className="text-xs text-slate-400 mt-1">
                Real-time transparency into how recruiters are processing your submissions.
              </p>
            </div>

            {applications.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center text-slate-500">
                <FaBriefcase className="text-3xl mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-semibold">You haven't submitted any job applications yet.</p>
                <button
                  onClick={() => setActiveView('jobs')}
                  className="mt-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition"
                >
                  Explore Open Jobs
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => {
                  const statusColors = {
                    Applied: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                    Screening: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                    Shortlisted: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                    Interview: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                    Offered: 'bg-green-500/20 text-green-300 border-green-500/30',
                    Rejected: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  };

                  return (
                    <div
                      key={app.application_id}
                      className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-white text-base">{app.job_title}</h3>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusColors[app.status] || statusColors.Applied}`}>
                            {app.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {app.company} • {app.location} • Applied on {app.applied_at}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-500 font-bold uppercase">ATS Compatibility</div>
                          <div className="text-2xl font-black text-purple-400">{app.ats_score}%</div>
                        </div>

                        {app.ats_breakdown && (
                          <button
                            onClick={() => {
                              setSelectedMatch(app.ats_breakdown);
                              setEvaluatingJob({ title: app.job_title, company: app.company });
                              setShowMatchModal(true);
                            }}
                            className="text-xs bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold px-3 py-2 rounded-xl transition"
                          >
                            View Audit
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: SAVED JOBS */}
        {activeView === 'saved' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Saved & Bookmarked Positions</h2>
              <p className="text-xs text-slate-400 mt-1">Review and apply to jobs you've shortlisted.</p>
            </div>

            {savedJobs.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center text-slate-500">
                <FaBookmark className="text-3xl mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-semibold">No saved jobs yet.</p>
                <p className="text-xs text-slate-600 mt-1">Click the bookmark icon on any job card to save it here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedJobs.map((job) => (
                  <div key={job.saved_id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-white text-base">{job.title}</h3>
                        <button
                          onClick={() => handleToggleSaveJob(job.job_id)}
                          className="text-amber-400 hover:text-rose-400 text-sm p-1 transition"
                          title="Remove from saved"
                        >
                          <FaBookmark />
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">{job.company} • {job.location}</p>
                      <p className="text-xs text-emerald-400 font-semibold mb-3">{job.salary_range}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                      <button
                        onClick={() => handleApply(job.job_id)}
                        disabled={appliedJobIds.has(job.job_id)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition ${
                          appliedJobIds.has(job.job_id)
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-purple-600 hover:bg-purple-500 text-white'
                        }`}
                      >
                        {appliedJobIds.has(job.job_id) ? "Applied" : "Apply Now"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 6: PROFILE & PREFERENCES (INTEGRATED IN DASHBOARD) */}
        {activeView === 'profile' && (
          <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
            <div className="pb-4 border-b border-slate-800">
              <h2 className="text-2xl font-black text-white tracking-tight">Candidate Profile & Career Targets</h2>
              <p className="text-xs text-slate-400 mt-1">
                Customize your profile details to match job recommendation algorithms.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    required
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Mobile Contact</label>
                  <input
                    type="text"
                    value={profileForm.mobile}
                    onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Current Role / Title</label>
                  <input
                    type="text"
                    value={profileForm.current_role}
                    onChange={(e) => setProfileForm({ ...profileForm, current_role: e.target.value })}
                    placeholder="e.g. Full Stack Developer"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Experience</label>
                  <input
                    type="text"
                    value={profileForm.experience}
                    onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value })}
                    placeholder="e.g. 3 Years"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Target Location</label>
                  <input
                    type="text"
                    value={profileForm.preferred_location}
                    onChange={(e) => setProfileForm({ ...profileForm, preferred_location: e.target.value })}
                    placeholder="e.g. Remote / New York"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Expected Salary</label>
                  <input
                    type="text"
                    value={profileForm.expected_salary}
                    onChange={(e) => setProfileForm({ ...profileForm, expected_salary: e.target.value })}
                    placeholder="e.g. $110,000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Availability</label>
                  <select
                    value={profileForm.availability}
                    onChange={(e) => setProfileForm({ ...profileForm, availability: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                  >
                    <option value="Immediate">Immediate</option>
                    <option value="2 Weeks">2 Weeks Notice</option>
                    <option value="1 Month">1 Month Notice</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">GitHub URL</label>
                  <input
                    type="text"
                    value={profileForm.github}
                    onChange={(e) => setProfileForm({ ...profileForm, github: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">LinkedIn URL</label>
                  <input
                    type="text"
                    value={profileForm.linkedin}
                    onChange={(e) => setProfileForm({ ...profileForm, linkedin: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Portfolio / Website</label>
                  <input
                    type="text"
                    value={profileForm.portfolio}
                    onChange={(e) => setProfileForm({ ...profileForm, portfolio: e.target.value })}
                    placeholder="https://mywebsite.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Key Projects & Achievements</label>
                <textarea
                  rows={3}
                  value={profileForm.projects}
                  onChange={(e) => setProfileForm({ ...profileForm, projects: e.target.value })}
                  placeholder="Describe your prominent production projects, tech stack used, and measurable results..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-3 px-6 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
              >
                {savingProfile ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                {savingProfile ? "Saving Profile..." : "Save Candidate Profile"}
              </button>
            </form>
          </div>
        )}

      </main>

      {/* ==================================================== */}
      {/* 3. ADVANCED ATS MATCH SCORE MODAL */}
      {/* ==================================================== */}
      {showMatchModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-slate-900 border border-purple-500/40 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-black text-white text-lg flex items-center gap-2">
                  <FaMagic className="text-purple-400" /> ATS Semantic Compatibility
                </h3>
                <p className="text-xs text-slate-400">{evaluatingJob?.title} • {evaluatingJob?.company}</p>
              </div>
              <button
                onClick={() => setShowMatchModal(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            {loadingMatch ? (
              <div className="py-16 text-center text-slate-400">
                <FaSpinner className="animate-spin text-3xl mx-auto mb-3 text-purple-500" />
                <p className="text-sm font-semibold">Running deep ATS semantic scan...</p>
                <p className="text-xs text-slate-500 mt-1">Comparing technical skills, experience relevance, and missing keywords</p>
              </div>
            ) : selectedMatch?.error ? (
              <div className="p-6 text-center text-rose-400 text-sm">
                {selectedMatch.error}
              </div>
            ) : selectedMatch ? (
              <div className="space-y-5">
                
                {/* Score Gauge */}
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Overall Match Score</span>
                    <h4 className="text-3xl font-black text-white mt-1">
                      {selectedMatch.score}%
                      <span className="text-xs text-purple-400 font-semibold ml-2">
                        {selectedMatch.score >= 75 ? '🔥 High Match' : '⚖️ Moderate Match'}
                      </span>
                    </h4>
                  </div>
                  <div className="w-16 h-16 rounded-full border-4 border-purple-500/40 border-t-purple-500 flex items-center justify-center text-lg font-black text-purple-300">
                    {selectedMatch.score}%
                  </div>
                </div>

                {/* Category Breakdown */}
                {selectedMatch.category_breakdown && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Skills Fit</div>
                      <div className="text-sm font-black text-white mt-1">{selectedMatch.category_breakdown.technical_skills_fit}%</div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Experience</div>
                      <div className="text-sm font-black text-white mt-1">{selectedMatch.category_breakdown.experience_relevance}%</div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Role Alignment</div>
                      <div className="text-sm font-black text-white mt-1">{selectedMatch.category_breakdown.role_alignment}%</div>
                    </div>
                  </div>
                )}

                {/* Matched Skills */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-2">
                    ✓ Matched Skill Keywords
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedMatch.matched_skills || []).map((skill, idx) => (
                      <span key={idx} className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-xs font-semibold">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Skills */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400 block mb-2">
                    ⚠ Critical Missing Keywords
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedMatch.missing_skills || []).map((skill, idx) => (
                      <span key={idx} className="bg-rose-500/10 text-rose-300 border border-rose-500/20 px-2.5 py-1 rounded-lg text-xs font-semibold">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Improvement Suggestions */}
                {selectedMatch.improvement_suggestions && (
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs text-slate-300 leading-relaxed">
                    <span className="text-purple-400 font-bold block mb-1">💡 Actionable Resume Recommendations:</span>
                    {selectedMatch.improvement_suggestions}
                  </div>
                )}

              </div>
            ) : null}

          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. AI COVER LETTER GENERATOR MODAL */}
      {/* ==================================================== */}
      {showCoverLetterModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-slate-900 border border-purple-500/40 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-black text-white text-lg flex items-center gap-2">
                  <FaEnvelopeOpenText className="text-purple-400" /> AI Executive Cover Letter
                </h3>
                <p className="text-xs text-slate-400">{selectedLetterJob?.title} • {selectedLetterJob?.company}</p>
              </div>
              <button
                onClick={() => setShowCoverLetterModal(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            {generatingLetter ? (
              <div className="py-16 text-center text-slate-400">
                <FaSpinner className="animate-spin text-3xl mx-auto mb-3 text-purple-500" />
                <p className="text-sm font-semibold">Synthesizing personalized cover letter...</p>
                <p className="text-xs text-slate-500 mt-1">Aligning your projects and skills with {selectedLetterJob?.company}'s goals</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans max-h-[400px] overflow-y-auto">
                  {coverLetterText}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(coverLetterText);
                      alert("📋 Cover letter copied to clipboard!");
                    }}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition flex items-center gap-2"
                  >
                    <FaCopy /> Copy to Clipboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
