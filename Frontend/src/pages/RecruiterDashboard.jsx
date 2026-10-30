import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaPlusCircle, FaUsers, FaFilePdf, FaRegBuilding, FaSpinner, 
  FaBriefcase, FaSignOutAlt, FaFilter, FaBrain, FaSearch, 
  FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaAward, FaUserCheck
} from 'react-icons/fa';
import { MdOutlineWorkOutline, MdScore } from 'react-icons/md';
import { API_BASE_URL } from '../config';
import { clearAuthSession, getAuthUser } from '../utils/auth';

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const user = getAuthUser();
  const recruiterId = user.userId || localStorage.getItem('user_id');

  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs', 'post', 'analytics'
  const [myJobs, setMyJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedJobResponses, setSelectedJobResponses] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingResponses, setFetchingResponses] = useState(false);

  // Filters
  const [scoreFilter, setScoreFilter] = useState('all'); // 'all', '75', '85'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [activeCandidateDetail, setActiveCandidateDetail] = useState(null);
  const [interviewQuestions, setInterviewQuestions] = useState(null);
  const [loadingInterviewQs, setLoadingInterviewQs] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState({
    total_jobs: 0,
    total_applicants: 0,
    high_ats_matches: 0,
    average_ats_score: 0,
    pipeline: {}
  });

  // Talent Pool State (Resdex / Candidate Search)
  const [talentPool, setTalentPool] = useState([]);
  const [talentSearch, setTalentSearch] = useState('');
  const [fetchingTalent, setFetchingTalent] = useState(false);

  // Post Job Form
  const [newJob, setNewJob] = useState({
    title: '',
    company: 'Acme Technologies',
    location: 'Remote',
    job_type: 'Full-time',
    salary_range: '$90,000 - $130,000',
    description: ''
  });

  useEffect(() => {
    if (recruiterId) {
      fetchMyJobs();
      fetchAnalytics();
    }
  }, [recruiterId]);

  const fetchMyJobs = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/recruiter/${recruiterId}/jobs`);
      setMyJobs(res.data);
      if (res.data.length > 0 && !selectedJob) {
        handleSelectJob(res.data[0]);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/recruiter/${recruiterId}/analytics`);
      setAnalytics(res.data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  };

  const fetchTalentPool = async () => {
    setFetchingTalent(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/recruiter/talent-pool?q=${talentSearch}`);
      setTalentPool(res.data);
    } catch (err) {
      console.error("Error fetching talent pool:", err);
    } finally {
      setFetchingTalent(false);
    }
  };

  const handleSelectJob = async (job) => {
    setSelectedJob(job);
    setFetchingResponses(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/recruiter/jobs/${job.id}/responses`);
      setSelectedJobResponses(res.data.responses || []);
    } catch (err) {
      console.error("Error fetching responses:", err);
    } finally {
      setFetchingResponses(false);
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('title', newJob.title);
    formData.append('company', newJob.company);
    formData.append('location', newJob.location);
    formData.append('job_type', newJob.job_type);
    formData.append('salary_range', newJob.salary_range);
    formData.append('description', newJob.description);
    formData.append('recruiter_id', recruiterId);

    try {
      await axios.post(`${API_BASE_URL}/recruiter/jobs`, formData);
      alert('🎉 Job posted successfully with AI Skill Extraction!');
      setNewJob({
        title: '',
        company: 'Acme Technologies',
        location: 'Remote',
        job_type: 'Full-time',
        salary_range: '$90,000 - $130,000',
        description: ''
      });
      setActiveTab('jobs');
      fetchMyJobs();
      fetchAnalytics();
    } catch (err) {
      alert('Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await axios.post(`${API_BASE_URL}/recruiter/applications/${applicationId}/status`, {
        status: newStatus
      });
      // Update local state
      setSelectedJobResponses(prev =>
        prev.map(r => r.application_id === applicationId ? { ...r, status: newStatus } : r)
      );
      fetchAnalytics();
    } catch (err) {
      alert("Error updating candidate pipeline status");
    }
  };

  const generateInterviewPrep = async (candidate, jobId) => {
    setLoadingInterviewQs(true);
    setInterviewQuestions(null);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/recruiter/candidates/${candidate.employee_id}/interview-questions?job_id=${jobId}`
      );
      setInterviewQuestions({ candidateName: candidate.employee_name, questions: res.data });
    } catch (err) {
      alert("Failed to generate AI interview questions");
    } finally {
      setLoadingInterviewQs(false);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate('/');
  };

  // Filter Responses
  const filteredResponses = (selectedJobResponses || []).filter(item => {
    const matchesSearch = item.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.employee_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesScore = scoreFilter === 'all' || 
                         (scoreFilter === '75' && item.ats_score >= 75) ||
                         (scoreFilter === '85' && item.ats_score >= 85);
    return matchesSearch && matchesStatus && matchesScore;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Navigation */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
            <FaRegBuilding className="text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              IHG <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">RECRUITER ENTERPRISE</span>
            </h1>
            <p className="text-xs text-slate-400">Intelligent Hiring & Candidate Ranking Portal</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'jobs' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MdOutlineWorkOutline /> Active Requisitions
          </button>
          <button
            onClick={() => { setActiveTab('post'); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'post' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FaPlusCircle /> Create Position
          </button>
          <button
            onClick={() => { setActiveTab('talent'); fetchTalentPool(); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'talent' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FaUsers /> Talent Pool Search
          </button>
        </div>

        {/* Profile & Logout */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-white">{user.name || user.email}</div>
            <div className="text-xs text-purple-400 font-semibold uppercase">Verified Recruiter</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 border border-slate-700 transition"
            title="Sign Out"
          >
            <FaSignOutAlt />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* Executive Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active Jobs</span>
              <FaBriefcase className="text-purple-400" />
            </div>
            <div className="text-3xl font-black text-white">{analytics.total_jobs}</div>
            <div className="text-xs text-slate-500 mt-1">Open requisition listings</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Applicants</span>
              <FaUsers className="text-blue-400" />
            </div>
            <div className="text-3xl font-black text-white">{analytics.total_applicants}</div>
            <div className="text-xs text-slate-500 mt-1">Candidates in recruitment funnel</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">High ATS Matches (75%+)</span>
              <FaAward className="text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400">{analytics.high_ats_matches}</div>
            <div className="text-xs text-slate-500 mt-1">AI pre-screened top tier candidates</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Average ATS Score</span>
              <MdScore className="text-amber-400 text-lg" />
            </div>
            <div className="text-3xl font-black text-amber-400">{analytics.average_ats_score}%</div>
            <div className="text-xs text-slate-500 mt-1">Candidate pool quality index</div>
          </div>
        </div>

        {/* TAB 1: JOB MANAGEMENT & CANDIDATE PIPELINE */}
        {activeTab === 'jobs' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Job Selector */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Your Posted Positions</h2>
                <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full font-bold">{myJobs.length}</span>
              </div>

              {myJobs.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                  <p className="text-sm mb-4">No jobs created yet.</p>
                  <button
                    onClick={() => setActiveTab('post')}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
                  >
                    Post Your First Job
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                  {myJobs.map((job) => {
                    const isSelected = selectedJob?.id === job.id;
                    return (
                      <div
                        key={job.id}
                        onClick={() => handleSelectJob(job)}
                        className={`p-4 rounded-2xl border cursor-pointer transition ${
                          isSelected 
                            ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-950/50' 
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-white text-base leading-snug">{job.title}</h3>
                          <span className="text-xs bg-slate-800 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/20 whitespace-nowrap">
                            {job.total_applications} apps
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                          <span>{job.company}</span>
                          <span>•</span>
                          <span>{job.location}</span>
                          <span>•</span>
                          <span className="text-purple-400 font-semibold">{job.job_type}</span>
                        </div>
                        {job.skills && (
                          <div className="flex flex-wrap gap-1.5">
                            {job.skills.split(',').slice(0, 3).map((s, idx) => (
                              <span key={idx} className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-md font-medium">
                                {s.trim()}
                              </span>
                            ))}
                            {job.skills.split(',').length > 3 && (
                              <span className="text-[10px] text-slate-500">+{job.skills.split(',').length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Candidate ATS Ranking & Pipeline */}
            <div className="lg:col-span-8 space-y-4">
              {selectedJob ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  
                  {/* Job Header & Filters */}
                  <div className="border-b border-slate-800 pb-5 mb-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h2 className="text-xl font-black text-white">{selectedJob.title}</h2>
                        <p className="text-xs text-slate-400">{selectedJob.company} • {selectedJob.location} • {selectedJob.salary_range}</p>
                      </div>

                      <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-xl font-bold self-start">
                        {filteredResponses.length} Candidates Qualified
                      </span>
                    </div>

                    {/* Filter Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="relative">
                        <FaSearch className="absolute left-3 top-3 text-slate-500 text-xs" />
                        <input
                          type="text"
                          placeholder="Search applicant name..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-purple-500"
                        />
                      </div>

                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-200 outline-none focus:border-purple-500"
                      >
                        <option value="all">All Stages</option>
                        <option value="Applied">Applied</option>
                        <option value="Screening">Screening</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Interview">Interview</option>
                        <option value="Offered">Offered</option>
                        <option value="Rejected">Rejected</option>
                      </select>

                      <select
                        value={scoreFilter}
                        onChange={(e) => setScoreFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-200 outline-none focus:border-purple-500"
                      >
                        <option value="all">All ATS Scores</option>
                        <option value="75">High Match (≥ 75%)</option>
                        <option value="85">Elite Match (≥ 85%)</option>
                      </select>
                    </div>
                  </div>

                  {/* Candidate List */}
                  {fetchingResponses ? (
                    <div className="text-center py-16 text-slate-500">
                      <FaSpinner className="animate-spin text-2xl mx-auto mb-2 text-purple-500" />
                      <p className="text-xs">Analyzing candidates with ATS scoring...</p>
                    </div>
                  ) : filteredResponses.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">
                      <p className="text-sm font-semibold">No candidates match the selected filters.</p>
                      <p className="text-xs text-slate-600 mt-1">Applications will appear here once candidates apply.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredResponses.map((candidate) => {
                        const score = candidate.ats_score || 0;
                        const scoreColor = score >= 80 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
                                           score >= 60 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
                                           'text-rose-400 bg-rose-500/10 border-rose-500/30';

                        return (
                          <div
                            key={candidate.application_id}
                            className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 p-5 rounded-2xl transition"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              
                              {/* Candidate Info */}
                              <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                  <h4 className="text-base font-bold text-white">{candidate.employee_name}</h4>
                                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${scoreColor}`}>
                                    ATS: {score}%
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400">
                                  {candidate.employee_role} • {candidate.experience ? `${candidate.experience} exp` : 'Candidate'} • {candidate.employee_email}
                                </p>
                              </div>

                              {/* Stage Selector & Actions */}
                              <div className="flex flex-wrap items-center gap-2">
                                <select
                                  value={candidate.status}
                                  onChange={(e) => handleStatusChange(candidate.application_id, e.target.value)}
                                  className="bg-slate-900 border border-purple-500/30 text-purple-300 font-bold text-xs rounded-xl px-3 py-2 outline-none cursor-pointer hover:bg-slate-800"
                                >
                                  <option value="Applied">Applied</option>
                                  <option value="Screening">Screening</option>
                                  <option value="Shortlisted">Shortlisted ⭐</option>
                                  <option value="Interview">Interview 📅</option>
                                  <option value="Offered">Offered 🎉</option>
                                  <option value="Rejected">Rejected</option>
                                </select>

                                <button
                                  onClick={() => generateInterviewPrep(candidate, selectedJob.id)}
                                  className="bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5"
                                  title="AI Interview Questions Generator"
                                >
                                  <FaBrain /> AI Interview Prep
                                </button>

                                {candidate.employee_resume && (
                                  <a
                                    href={`${API_BASE_URL}/resumes/${candidate.employee_resume.replace('resumes/', '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5"
                                  >
                                    <FaFilePdf className="text-red-400" /> Resume
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* ATS Breakdown Summary */}
                            {candidate.ats_breakdown && (
                              <div className="mt-4 pt-3 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-slate-500 font-semibold">Matched Skills: </span>
                                  <span className="text-emerald-400">
                                    {(candidate.ats_breakdown.matched_skills || []).slice(0, 4).join(', ') || 'Core Skills'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-500 font-semibold">Missing Keywords: </span>
                                  <span className="text-rose-400">
                                    {(candidate.ats_breakdown.missing_skills || []).slice(0, 3).join(', ') || 'None identified'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                  Select a job posting on the left to view the candidate pipeline.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: POST NEW JOB WITH AI SKILL EXTRACTION */}
        {activeTab === 'post' && (
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-600/20 text-purple-400 rounded-xl flex items-center justify-center text-xl">
                <FaPlusCircle />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Create Requisition</h2>
                <p className="text-xs text-slate-400">AI automatically parses and indexes skills for ATS matching</p>
              </div>
            </div>

            <form onSubmit={handlePostJob} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Full Stack Engineer"
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Company</label>
                  <input
                    type="text"
                    value={newJob.company}
                    onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Remote / New York"
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Employment Type</label>
                  <select
                    value={newJob.job_type}
                    onChange={(e) => setNewJob({ ...newJob, job_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Remote">Remote</option>
                    <option value="Contract">Contract</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Salary Range</label>
                  <input
                    type="text"
                    placeholder="e.g. $100,000 - $140,000"
                    value={newJob.salary_range}
                    onChange={(e) => setNewJob({ ...newJob, salary_range: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Job Description & Requirements</label>
                <textarea
                  rows={6}
                  placeholder="Paste complete description with required technical stack..."
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? <FaSpinner className="animate-spin" /> : "Publish Position with AI Skill Tagging"}
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: TALENT POOL SEARCH (NAUKRI RESDEX / LINKEDIN RECRUITER STYLE) */}
        {activeTab === 'talent' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-black text-white">Platform Candidate Talent Pool</h2>
                <p className="text-xs text-slate-400">Search and scout verified job seekers across technology domains.</p>
              </div>

              {/* Search Box */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter by skill, name, role..."
                  value={talentSearch}
                  onChange={(e) => setTalentSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchTalentPool()}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-purple-500 w-64"
                />
                <button
                  onClick={fetchTalentPool}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2 px-4 rounded-xl transition"
                >
                  Search
                </button>
              </div>
            </div>

            {fetchingTalent ? (
              <div className="py-20 text-center text-slate-500">
                <FaSpinner className="animate-spin text-3xl mx-auto mb-2 text-purple-500" />
                <p className="text-xs">Searching platform talent directory...</p>
              </div>
            ) : talentPool.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center text-slate-500">
                <FaUsers className="text-3xl mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-semibold">No candidates found matching your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {talentPool.map((c) => (
                  <div key={c.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-bold text-white text-base leading-snug">{c.name}</h3>
                          <p className="text-xs text-purple-400 font-medium">{c.current_role}</p>
                        </div>
                        {c.has_resume && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                            Resume Verified
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mb-2">{c.experience} exp • {c.location}</p>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {(c.skills || '').split(',').slice(0, 4).map((s, idx) => (
                          <span key={idx} className="text-[10px] bg-slate-950 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                            {s.trim()}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 truncate max-w-[150px]">{c.email}</span>
                      {c.resume_path && (
                        <a
                          href={`${API_BASE_URL}/resumes/${c.resume_path.replace('resumes/', '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
                        >
                          <FaFilePdf className="text-red-400" /> Resume
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* AI Interview Question Modal */}
      {(loadingInterviewQs || interviewQuestions) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-slate-900 border border-purple-500/40 rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <FaBrain className="text-purple-400 text-xl" />
                <h3 className="font-black text-white text-lg">AI Interview Prep Sheet</h3>
              </div>
              <button
                onClick={() => { setInterviewQuestions(null); setLoadingInterviewQs(false); }}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            {loadingInterviewQs ? (
              <div className="py-16 text-center text-slate-400">
                <FaSpinner className="animate-spin text-3xl mx-auto mb-3 text-purple-500" />
                <p className="text-sm font-semibold">Generating tailored technical & behavioral questions...</p>
                <p className="text-xs text-slate-500 mt-1">Cross-referencing candidate's resume against job requirements</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Targeted questions generated specifically for <span className="text-white font-bold">{interviewQuestions?.candidateName}</span>:
                </p>

                {interviewQuestions?.questions?.map((q, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-md border border-purple-500/30">
                        {q.category}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">Q{idx + 1}</span>
                    </div>
                    <p className="text-sm font-bold text-white mb-2">{q.question}</p>
                    <div className="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-purple-400 font-semibold">Expected Signal: </span>
                      {q.expected_signal}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
