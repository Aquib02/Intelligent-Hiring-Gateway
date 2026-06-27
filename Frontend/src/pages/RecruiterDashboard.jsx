import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaPlusCircle, FaListAlt, FaUsers, 
  FaFilePdf, FaRegBuilding, FaSpinner, FaBriefcase
} from 'react-icons/fa';
import { MdOutlineWorkOutline } from 'react-icons/md';

export default function RecruiterDashboard() {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('post'); // 'post' or 'show'
  const [myJobs, setMyJobs] = useState([]);
  const [selectedJobResponses, setSelectedJobResponses] = useState(null);
  const [newJob, setNewJob] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [fetchingResponsesId, setFetchingResponsesId] = useState(null);

  const recruiterId = localStorage.getItem('user_id');

  // Security Check: Sirf recruiter hi is page par aa sakta hai
  useEffect(() => {
    const role = localStorage.getItem('role');
    if (!recruiterId || role !== 'recruiter') {
      navigate('/');
    }
  }, [navigate, recruiterId]);

  // Tab change hone par jobs fetch karein
  useEffect(() => {
    if (activeTab === 'show') {
      fetchMyJobs();
      setSelectedJobResponses(null); // Tab change karne par purane responses clear kar do
    }
  }, [activeTab]);

  // --- IS PART KO REPLACE KAREIN ---
const fetchMyJobs = async () => {
  if (!recruiterId) return; // ID check safety
  try {
    // Backend se confirm karein ki URL /recruiter/ID/jobs hai ya /recruiter/jobs/ID
    const res = await axios.get(`http://localhost:8000/recruiter/${recruiterId}/jobs`);
    console.log("Fetched Jobs:", res.data); // Debugging ke liye
    setMyJobs(res.data);
  } catch (err) {
    console.error("Jobs fetch karne mein error:", err);
  }
};

const handleLogout = () => {
    localStorage.clear();
    navigate('/');
};

  const handlePostJob = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('title', newJob.title);
    
    formData.append('description', newJob.description);
    formData.append('recruiter_id', recruiterId);

    try {
      await axios.post('http://localhost:8000/recruiter/jobs', formData);
      alert('🎉 Job successfully posted with AI Skills Extraction!');
      setNewJob({ title: '', description: '' });
      setActiveTab('show'); 
    } catch (err) {
      alert('Job post karne mein error aayi.');
    } finally {
      setLoading(false);
    }
  };

  const viewResponses = async (jobId) => {
    // Agar pehle se open hai, toh toggle (close) kar do
    if (selectedJobResponses && selectedJobResponses.job_id === jobId) {
      setSelectedJobResponses(null);
      return;
    }

    setFetchingResponsesId(jobId);
    try {
  const res = await axios.get(`http://localhost:8000/recruiter/jobs/${jobId}/responses`);
  
  // Safety check: Agar backend se data structure different hai
  const data = res.data.responses ? res.data : { job_id: jobId, responses: res.data };
  setSelectedJobResponses(data);
}
    catch (err) {
      alert("Responses fetch karne mein error aayi.");
    } finally {
      setFetchingResponsesId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2ff] font-sans pb-12">
      
      {/* Top Navbar Area */}
      {/* Top Navbar Area */}
<div className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 mb-8 flex justify-between items-center sticky top-0 z-50">
  <div className="flex items-center gap-3">
    <div className="bg-[#6e4ef2] p-2.5 rounded-xl text-white shadow-lg">
      <FaRegBuilding className="text-xl" />
    </div>
    <div>
      <h1 className="text-2xl font-black text-gray-800 tracking-tight leading-none">
        Intelligent Hiring<span className="text-[#6e4ef2]"> Gateway</span>
      </h1>
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recruiter Hub</span>
    </div>
  </div>

  {/* Right Side: Profile with Dropdown */}
  <div className="relative">
    {/* HR Button (Avatar) */}
    <button 
      onClick={() => setShowDropdown(!showDropdown)}
      className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-[#6e4ef2] font-bold border-2 border-[#6e4ef2] shadow-sm hover:bg-purple-200 transition-all focus:outline-none"
    >
      HR
    </button>

    {/* Dropdown Menu (Logout Box) */}
    {showDropdown && (
      <>
        {/* Bahar click karne pe band karne ke liye Overlay */}
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setShowDropdown(false)}
        ></div>
        
        {/* Actual Dropdown Box */}
        <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-20 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-50 bg-gray-50/50">
            <p className="text-[10px] uppercase font-bold text-gray-400">Account</p>
            <p className="text-sm font-bold text-gray-700">Recruiter Admin</p>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-bold flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </>
    )}
  </div>
</div>

      <div className="max-w-5xl mx-auto px-4">
        
        {/* Custom Premium Tabs */}
        <div className="flex justify-center mb-10">
          <div className="bg-white p-1.5 rounded-2xl shadow-md border border-gray-100 inline-flex">
            <button 
              onClick={() => setActiveTab('post')}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all duration-300 ${activeTab === 'post' ? 'bg-[#6e4ef2] text-white shadow-md' : 'text-gray-500 hover:text-[#6e4ef2] hover:bg-purple-50'}`}
            >
              <FaPlusCircle className={activeTab === 'post' ? 'text-white' : 'text-gray-400'} /> 
              Post New Job
            </button>
            <button 
              onClick={() => setActiveTab('show')}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all duration-300 ${activeTab === 'show' ? 'bg-[#6e4ef2] text-white shadow-md' : 'text-gray-500 hover:text-[#6e4ef2] hover:bg-purple-50'}`}
            >
              <FaListAlt className={activeTab === 'show' ? 'text-white' : 'text-gray-400'} /> 
              Manage Jobs & Applicants
            </button>
          </div>
        </div>

        {/* --- TAB 1: POST JOB --- */}
        {activeTab === 'post' && (
          <div className="bg-white p-10 rounded-[2rem] shadow-xl border border-gray-100 animate-[fadeIn_0.3s_ease-out]">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-black text-gray-900 mb-2">Create a Job Posting</h2>
              <p className="text-gray-500">Our AI will automatically extract required skills from your description.</p>
            </div>

            <form onSubmit={handlePostJob} className="space-y-6 max-w-3xl mx-auto">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Job Title</label>
                <div className="relative">
                  <FaBriefcase className="absolute top-4 left-4 text-gray-400" />
                  <input 
                    type="text" value={newJob.title} onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-[#f5f6fa] border-2 border-transparent text-gray-800 rounded-xl outline-none focus:border-[#6e4ef2] focus:bg-white transition font-medium" 
                    placeholder="e.g. Senior Frontend Developer (React)"
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Detailed Job Description</label>
                <textarea 
                  value={newJob.description} onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                  className="w-full p-4 bg-[#f5f6fa] border-2 border-transparent text-gray-800 rounded-xl outline-none focus:border-[#6e4ef2] focus:bg-white transition min-h-[200px] resize-y font-medium" 
                  placeholder="Describe the role, responsibilities, and required technologies (e.g., Python, AWS, React)..."
                  required 
                ></textarea>
                <p className="text-xs text-gray-400 mt-2 text-right">Markdown and bullet points are supported by AI.</p>
              </div>

              <button 
                type="submit" disabled={loading}
                className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition duration-300 flex justify-center items-center gap-2 text-lg
                  ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#6e4ef2] to-blue-600 hover:shadow-xl hover:-translate-y-0.5'}
                `}
              >
                {loading ? <><FaSpinner className="animate-spin" /> AI Analyzing Details...</> : "Publish Job Posting ✨"}
              </button>
            </form>
          </div>
        )}

        {/* --- TAB 2: SHOW JOBS & APPLICANTS --- */}
        {activeTab === 'show' && (
          <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            {myJobs.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-12 text-center shadow-lg border border-gray-100">
                <MdOutlineWorkOutline className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-700">No active postings</h3>
                <p className="text-gray-500 mt-2">You haven't posted any jobs yet. Switch to the 'Post New Job' tab to get started.</p>
              </div>
            ) : (
              myJobs.map(job => (
                <div key={job.id} className="bg-white rounded-[2rem] shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl">
                  
                  {/* Job Header */}
                  <div className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">{job.title}</h2>
                      <div className="flex flex-wrap gap-2">
                        {job.skills ? job.skills.split(',').slice(0,3).map((skill, i) => (
                           <span key={i} className="text-xs bg-[#f0f2ff] text-[#6e4ef2] px-2 py-1 rounded font-semibold">{skill.trim()}</span>
                        )) : null}
                        {job.skills && job.skills.split(',').length > 3 && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded font-semibold">+{job.skills.split(',').length - 3} more</span>}
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => viewResponses(job.id)}
                      disabled={fetchingResponsesId === job.id}
                      className="bg-gray-900 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-gray-800 transition shadow-md flex items-center gap-2 flex-shrink-0"
                    >
                      {fetchingResponsesId === job.id ? <FaSpinner className="animate-spin" /> : <FaUsers />}
                      {selectedJobResponses && selectedJobResponses.job_id === job.id ? 'Close Applicants' : 'View Applicants'}
                    </button>
                  </div>

                  {/* Applicants List (Collapsible) */}
                  {selectedJobResponses && selectedJobResponses.job_id === job.id && (
                    <div className="bg-[#f8f9ff] border-t border-purple-100 p-8">
                      <div className="flex justify-between items-end mb-6">
                        <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm flex items-center gap-2">
                          <FaListAlt className="text-[#6e4ef2]" /> Applications Received
                        </h3>
                        <span className="bg-[#6e4ef2] text-white text-xs font-bold px-3 py-1 rounded-full">
                          {selectedJobResponses.responses.length} Total
                        </span>
                      </div>

                      {selectedJobResponses.responses.length === 0 ? (
                        <div className="bg-white p-8 rounded-xl text-center border border-gray-200 border-dashed">
                          <p className="text-gray-500 font-medium">No candidates have applied for this position yet.</p>
                        </div>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                          {selectedJobResponses.responses.map(resp => (
                            <div key={resp.application_id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition group relative overflow-hidden">
                              {/* Left side accent line */}
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#6e4ef2] opacity-0 group-hover:opacity-100 transition"></div>
                              
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <p className="font-bold text-gray-900 text-lg leading-tight">{resp.employee_name}</p>
                                  <p className="text-sm text-gray-500 truncate max-w-[200px]">{resp.employee_email}</p>
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50">
                                <span className="text-xs font-semibold text-gray-400">{resp.employee_mobile}</span>
                                <a 
                                  href={`http://localhost:8000/${resp.employee_resume}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm font-bold text-[#6e4ef2] bg-purple-50 hover:bg-[#6e4ef2] hover:text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                                >
                                  <FaFilePdf /> View Resume
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}