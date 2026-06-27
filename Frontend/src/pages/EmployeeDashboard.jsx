import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaBriefcase, FaMagic, FaCheckCircle, FaRegLightbulb, 
  FaSpinner, FaUserCircle, FaSignOutAlt, FaTimes 
} from 'react-icons/fa';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loadingMatch, setLoadingMatch] = useState(false); 
  const [loadingScoreId, setLoadingScoreId] = useState(null); 
  const [applyingId, setApplyingId] = useState(null);
  

  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    fetchJobs();
    // Fetch initial profile for navbar initial
    const userId = localStorage.getItem('user_id');
    if(userId) {
      axios.get(`https://intelligent-hiring-gateway.onrender.com/user/${userId}`)
        .then(res => setUserProfile(res.data))
        .catch(err => console.log("Profile fetch error"));
    }
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await axios.get('https://intelligent-hiring-gateway.onrender.com/jobs');
      setJobs(res.data);
    } catch (err) {
      console.error("Jobs fetch error:", err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };
  

  const handleViewProfile = async () => {
    const userId = localStorage.getItem('user_id');
    setShowDropdown(false);
    try {
      const res = await axios.get(`https://intelligent-hiring-gateway.onrender.com/user/${userId}`);
      setUserProfile(res.data);
      setShowProfileModal(true);
    } catch (err) {
      alert("Profile fetch karne mein error aayi.");
    }
  };

  const handleApply = async (jobId) => {
    setApplyingId(jobId);
    const employeeId = localStorage.getItem('user_id');
    
    // Updated: Using FormBody for backend compatibility
    const formData = new FormData();
    formData.append('job_id', jobId);
    formData.append('employee_id', employeeId);

    try {
    const res = await axios.post('https://intelligent-hiring-gateway.onrender.com/employee/apply', formData);
    alert('🎉 Successfully applied!');
  } catch (error) {
    if (error.response) {
      // 🔴 Backend se aaya error (important part)
      if (error.response.status === 400) {
        alert(error.response.data.detail); // 👉 "You have already applied..."
      } else {
        alert("Server error. Try again.");
      }
    } else {
      alert("Network error. Backend run ho raha hai ya nahi check karo.");
    }
  } finally {
    setApplyingId(null);
  }
};

    











  const checkAiMatch = async (jobId) => {
  const employeeId = localStorage.getItem('user_id');

  setShowMatchModal(true);   // 👈 modal open
  setLoadingMatch(true);
  setSelectedMatch(null);

  try {
    const res = await axios.get(
      `http://localhost:8000/match-score?job_id=${jobId}&employee_id=${employeeId}`
    );

    setSelectedMatch(res.data);
  } catch (error) {
    console.error("AI Match Error:", error);

    if (error.response?.status === 429) {
      setSelectedMatch({ error: "AI limit reached. Try later." });
    } else {
      setSelectedMatch({ error: "Profile incomplete or resume missing." });
    }
  } finally {
    setLoadingMatch(false);
  }
};

  return (
    <div className="min-h-screen bg-[#f0f2ff] pb-12 relative font-sans">
      
      {/* --- NAVBAR --- */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 mb-8 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/employee/dashboard')}>
          <div className="bg-[#6e4ef2] p-2 rounded-lg text-white">
            <FaBriefcase className="text-xl" />
          </div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Intelligent Hiring<span className="text-[#6e4ef2]"> Gateway</span></h1>
        </div>

        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#6e4ef2] font-bold border-2 border-[#6e4ef2] hover:bg-[#6e4ef2] hover:text-white transition-all duration-300 shadow-sm"
          >
            {userProfile?.name?.charAt(0).toUpperCase() || "U"}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in duration-200">
              <button 
                onClick={handleViewProfile}
                className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-purple-50 hover:text-[#6e4ef2] flex items-center gap-3 transition"
              >
                <FaUserCircle className="text-lg" /> My Profile
              </button>
              <div className="border-t border-gray-100 my-1"></div>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 transition"
              >
                <FaSignOutAlt className="text-lg" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-10">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-2">Find Your Dream Job</h2>
          <p className="text-lg text-gray-500">Match your skills with AI and apply instantly.</p>
        </div>
        
        <div className="grid gap-8 lg:grid-cols-2">
          {jobs.map(job => (
            <div key={job.id} className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100 transition-all hover:shadow-2xl flex flex-col group relative overflow-hidden">
                <h3 className="text-2xl font-bold text-gray-900 leading-tight mb-4">{job.title}</h3>
                <p className="text-gray-600 mb-6 line-clamp-3">{job.description}</p>
                
                <div className="mt-auto flex gap-3">
                  <button 
                    onClick={() => handleApply(job.id)} 
                    disabled={applyingId === job.id}
                    className="flex-1 bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition flex items-center justify-center"
                  >
                    {applyingId === job.id ? <FaSpinner className="animate-spin" /> : "Apply Now"}
                  </button>
                  <button 
                    onClick={() => checkAiMatch(job.id)} 
                    disabled={loadingScoreId !== null}
                    className="flex-1 bg-[#6e4ef2] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#5a3edb] transition"
                  >
                    {loadingScoreId === job.id ? <FaSpinner className="animate-spin" /> : <><FaMagic /> AI Match</>}
                  </button>
                </div>

                {/* --- DETAILED AI ANALYSIS RESULT --- */}
                {showMatchModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    
    <div className="bg-white w-[90%] max-w-xl rounded-2xl p-6 shadow-2xl relative">
      
      {/* Close */}
      <button 
        onClick={() => setShowMatchModal(false)}
        className="absolute top-3 right-3 text-gray-500 hover:text-black"
      >
        ✖
      </button>

      <h2 className="text-2xl font-bold text-center mb-4">
        AI Match Analysis
      </h2>

      {loadingMatch ? (
        <div className="flex justify-center py-10">
          <FaSpinner className="animate-spin text-2xl" />
        </div>
      ) : selectedMatch?.error ? (
        <p className="text-red-500 text-center">{selectedMatch.error}</p>
      ) : (
        <div className="space-y-4">

          <div className="text-center">
            <p className="text-gray-500">Match Score</p>
            <h1 className="text-4xl font-bold text-green-600">
              {selectedMatch?.score}%
            </h1>
          </div>

          <div>
            <h3 className="font-bold">Matched Skills</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedMatch?.matched_skills?.map((s, i) => (
                <span key={i} className="bg-green-100 px-2 py-1 rounded text-sm">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold">Missing Skills</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedMatch?.missing_skills?.map((s, i) => (
                <span key={i} className="bg-red-100 px-2 py-1 rounded text-sm">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold">Suggestions</h3>
            <p className="text-sm text-gray-600">
              {selectedMatch?.improvement_suggestions}
            </p>
          </div>

        </div>
      )}
    </div>
  </div>
)}
            </div>
          ))}
        </div>
      </div>

      {/* --- PROFILE MODAL --- */}
      {showProfileModal && userProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
            <div className="bg-gradient-to-r from-[#6e4ef2] to-blue-600 p-8 text-white">
              <button onClick={() => setShowProfileModal(false)} className="absolute top-6 right-6 text-white/80 hover:text-white transition"><FaTimes size={24} /></button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-3xl font-black">
                  {userProfile.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{userProfile.name}</h2>
                  <p className="text-blue-100 text-sm">{userProfile.email}</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div><p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1">Mobile</p><p className="text-gray-800 font-semibold">{userProfile.mobile}</p></div>
                <div><p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1">Address</p><p className="text-gray-800 font-semibold">{userProfile.address}</p></div>

                <div><p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1">Experience</p><p className="text-gray-800 font-semibold">{userProfile.experience}</p></div>

                <div><p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1">Role</p><p className="text-gray-800 font-semibold">{userProfile.current_role}</p></div>



                






                <div><p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1">Gender</p><p className="text-gray-800 font-semibold">{userProfile.gender}</p></div>
              </div>
              <div><p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1">Education</p><p className="text-gray-800 font-semibold bg-gray-50 p-3 rounded-xl border border-gray-100">{userProfile.education}</p></div>
              <div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1">Extracted AI Skills</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {userProfile.skills && userProfile.skills !== "Not available" ? (
                    userProfile.skills.split(',').map((skill, i) => (
                      <span key={i} className="bg-purple-50 text-[#6e4ef2] px-3 py-1 rounded-lg text-xs font-bold border border-purple-100">
                        {skill.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-xs italic">No skills extracted yet. Please update your profile.</span>
                  )}
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <a 
                  href={`http://localhost:8000/resumes/${userProfile.resume_path}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-full bg-[#f5f6fa] text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2"
                >
                  View Uploaded Resume
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}