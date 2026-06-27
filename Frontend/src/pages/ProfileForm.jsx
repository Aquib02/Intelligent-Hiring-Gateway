import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaRegUser, FaMapMarkerAlt, FaGraduationCap, 
  FaPhoneAlt, FaTransgender, FaCloudUploadAlt, FaSpinner, FaBriefcase 
} from 'react-icons/fa';

export default function ProfileForm() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    education: '',
    gender: '',
    mobile: '',
    experience: '',
    current_role: '',
    preferred_role: '',
    
    skills_manual: '',
    
    preferred_location: '',
    job_type: '',
    expected_salary: '',
    availability: '',
    
    github: '',
    linkedin: '',
    portfolio: '',
    
    projects: ''

  });
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("No file selected");

  // Auth check (Security)
  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    const role = localStorage.getItem('role');
    
    if (!userId || role !== 'employee') {
      navigate('/');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (PDF is best for Gemini processing)
      if (file.type !== 'application/pdf') {
        alert("Please upload a PDF file for better AI analysis.");
        return;
      }
      setResume(file);
      setFileName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!resume) {
      alert("Please upload your resume.");
      return;
    }

    setLoading(true);
    const userId = localStorage.getItem('user_id');

    // Create FormData object
    const submissionData = new FormData();

    submissionData.append('user_id', userId);

    // 🔥 ALL fields automatically
    Object.keys(formData).forEach(key => {
      submissionData.append(key, formData[key]);
    });

    // resume alag se
    submissionData.append('resume', resume);

    try {
      // API call to the backend update_profile endpoint
      const response = await axios.post('http://localhost:8000/employee/profile', submissionData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if(response.status === 200) {
        alert('✨ Profile saved! AI has successfully extracted skills from your resume.');
        navigate('/employee/dashboard'); 
      }
      
    } catch (error) {
      console.error('Error saving profile:', error);
      // Handling 429 specifically for UX
      if (error.response?.status === 429) {
        alert('AI Limit reached. Please wait a moment before trying again.');
      } else {
        alert(error.response?.data?.detail || 'Failed to update profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2ff] p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#6e4ef2] rounded-full mix-blend-multiply filter blur-[120px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-[120px] opacity-20"></div>

      <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden z-10 flex flex-col md:flex-row">
        
        {/* Left Side: Header & Info */}
        <div className="md:w-2/5 bg-gradient-to-br from-[#6e4ef2] to-blue-600 p-10 text-white flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full transform translate-x-10 -translate-y-10"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full transform -translate-x-5 translate-y-5"></div>
          
          <h2 className="text-4xl font-black mb-4 relative z-10 leading-tight">Complete Your Profile</h2>
          <p className="text-blue-100 mb-8 relative z-10 text-lg">
            Let's get you set up. Our AI will analyze your resume to extract skills and find the perfect job matches.
          </p>
          
          <div className="bg-white/10 p-5 rounded-xl border border-white/20 backdrop-blur-sm relative z-10">
            <h3 className="font-bold text-sm text-yellow-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>💡</span> PRO TIP
            </h3>
            <p className="text-sm text-blue-50 leading-relaxed">
              Using a clear PDF resume helps our AI accurately identify your core technical strengths!
            </p>
          </div>
        </div>

        {/* Right Side: The Form */}
        <div className="md:w-3/5 p-8 md:p-12 bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Name Field */}
          

  <h3 className="text-lg font-bold text-gray-800">Professional Details</h3>

   
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <FaRegUser className="absolute top-4 left-4 text-gray-400" />
                <input 
                  type="text" name="name" value={formData.name} onChange={handleChange} required
                  className="w-full pl-11 pr-4 py-3 bg-[#f5f6fa] border-2 border-transparent text-gray-800 rounded-xl outline-none focus:border-[#6e4ef2] focus:bg-white transition" 
                  placeholder="Faheem Arshad"
                />
              </div>
            </div>

            {/* Mobile Field */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Mobile Number</label>
              <div className="relative">
                <FaPhoneAlt className="absolute top-4 left-4 text-gray-400" />
                <input 
                  type="tel" name="mobile" value={formData.mobile} onChange={handleChange} required
                  className="w-full pl-11 pr-4 py-3 bg-[#f5f6fa] border-2 border-transparent text-gray-800 rounded-xl outline-none focus:border-[#6e4ef2] focus:bg-white transition" 
                  placeholder="+91 00000 00000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gender */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Gender</label>
                <div className="relative">
                  <FaTransgender className="absolute top-4 left-4 text-gray-400" />
                  <select 
                    name="gender" value={formData.gender} onChange={handleChange} required
                    className="w-full pl-11 pr-4 py-3 bg-[#f5f6fa] border-2 border-transparent text-gray-800 rounded-xl outline-none focus:border-[#6e4ef2] focus:bg-white transition appearance-none cursor-pointer"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Education */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Highest Education</label>
                <div className="relative">
                  <FaGraduationCap className="absolute top-4 left-4 text-gray-400" />
                  <input 
                    type="text" name="education" value={formData.education} onChange={handleChange} required
                    className="w-full pl-11 pr-4 py-3 bg-[#f5f6fa] border-2 border-transparent text-gray-800 rounded-xl outline-none focus:border-[#6e4ef2] focus:bg-white transition" 
                    placeholder="B.Tech Computer Science"
                  />
                </div>
              </div>
            </div>


            <div className="space-y-6">

  <h3 className="text-lg font-bold text-gray-800">Professional Details</h3>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

    {/* Experience */}
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-1">Experience</label>
      <div className="relative">
        <FaBriefcase className="absolute top-4 left-4 text-gray-400" />
        <input 
          name="experience"
          value={formData.experience}
          onChange={handleChange}
          className="w-full pl-11 pr-4 py-3 bg-[#f5f6fa] border-2 border-transparent rounded-xl"
          placeholder="0-1 years"
        />
      </div>
    </div>

    {/* Current Role */}
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-1">Current Role</label>
      <div className="relative">
        <FaRegUser className="absolute top-4 left-4 text-gray-400" />
        <input 
          name="current_role"
          value={formData.current_role}
          onChange={handleChange}
          className="w-full pl-11 pr-4 py-3 bg-[#f5f6fa] border-2 border-transparent rounded-xl"
          placeholder="Fresher"
        />
      </div>
    </div>

    {/* Preferred Role */}
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-1">Preferred Role</label>
      <div className="relative">
        <FaGraduationCap className="absolute top-4 left-4 text-gray-400" />
        <input 
          name="preferred_role"
          value={formData.preferred_role}
          onChange={handleChange}
          className="w-full pl-11 pr-4 py-3 bg-[#f5f6fa] border-2 border-transparent rounded-xl"
          placeholder="Frontend Developer"
        />
      </div>
    </div>

  </div>
</div>   
{/* skills */}
<div className="space-y-4">

  <h3 className="text-lg font-bold text-gray-800">Skills</h3>

  <div>
    <label className="block text-sm font-bold text-gray-700 mb-1">Manual Skills</label>
    <div className="relative">
      <FaGraduationCap className="absolute top-4 left-4 text-gray-400" />
      <input 
        name="skills_manual"
        value={formData.skills_manual}
        onChange={handleChange}
        className="w-full pl-11 pr-4 py-3 bg-[#f5f6fa] border-2 border-transparent rounded-xl"
        placeholder="Python, React, SQL"
      />
    </div>
  </div>

</div>

<div className="space-y-4">

  <h3 className="text-lg font-bold text-gray-800">Job Preferences</h3>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

    <input 
      name="preferred_location"
      value={formData.preferred_location}
      onChange={handleChange}
      className="w-full pl-4 pr-4 py-3 bg-[#f5f6fa] border-2 border-transparent rounded-xl"
      placeholder="Preferred Location"
    />

    <select 
      name="job_type"
      value={formData.job_type}
      onChange={handleChange}
      className="w-full pl-4 pr-4 py-3 bg-[#f5f6fa] border-2 border-transparent rounded-xl"
    >
      <option value="">Job Type</option>
      <option>Remote</option>
      <option>Onsite</option>
      <option>Hybrid</option>
    </select>

  </div>

  <input 
    name="expected_salary"
    value={formData.expected_salary}
    onChange={handleChange}
    className="w-full pl-4 pr-4 py-3 bg-[#f5f6fa] border-2 border-transparent rounded-xl"
    placeholder="Expected Salary"
  />

  <select 
    name="availability"
    value={formData.availability}
    onChange={handleChange}
    className="w-full pl-4 pr-4 py-3 bg-[#f5f6fa] border-2 border-transparent rounded-xl"
  >
    <option value="">Availability</option>
    <option>Immediate</option>
    <option>15 Days</option>
    <option>1 Month</option>
  </select>

</div>

<div className="space-y-4">

  <h3 className="text-lg font-bold text-gray-800">Links</h3>

  <input name="github" value={formData.github} onChange={handleChange}
    className="w-full pl-4 pr-4 py-3 bg-[#f5f6fa] rounded-xl"
    placeholder="GitHub URL"
  />

  <input name="linkedin" value={formData.linkedin} onChange={handleChange}
    className="w-full pl-4 pr-4 py-3 bg-[#f5f6fa] rounded-xl"
    placeholder="LinkedIn URL"
  />

  <input name="portfolio" value={formData.portfolio} onChange={handleChange}
    className="w-full pl-4 pr-4 py-3 bg-[#f5f6fa] rounded-xl"
    placeholder="Portfolio URL"
  />

</div>


<div>
  <label className="block text-sm font-bold text-gray-700 mb-1">Projects</label>
  <textarea 
    name="projects"
    value={formData.projects}
    onChange={handleChange}
    className="w-full pl-4 pr-4 py-3 bg-[#f5f6fa] rounded-xl"
    placeholder="Describe your projects..."
  />
</div>


            






            {/* Address Field */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Address</label>
              <div className="relative">
                <FaMapMarkerAlt className="absolute top-4 left-4 text-gray-400" />
                <textarea 
                  name="address" value={formData.address} onChange={handleChange} required rows="2"
                  className="w-full pl-11 pr-4 py-3 bg-[#f5f6fa] border-2 border-transparent text-gray-800 rounded-xl outline-none focus:border-[#6e4ef2] focus:bg-white transition resize-none" 
                  placeholder="Gorakhpur, Uttar Pradesh"
                ></textarea>
              </div>
            </div>

            {/* Resume Upload */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Upload Resume (PDF only)</label>
              <div className="relative w-full group">
                <input 
                  type="file" onChange={handleFileChange} required accept=".pdf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
                <div className="w-full p-6 border-2 border-dashed border-[#6e4ef2]/30 rounded-xl bg-purple-50 text-center flex flex-col items-center justify-center transition group-hover:border-[#6e4ef2] group-hover:bg-purple-100/50">
                  <FaCloudUploadAlt className="text-4xl text-[#6e4ef2] mb-2" />
                  <p className="text-sm text-purple-900 font-bold">{fileName}</p>
                  <p className="text-xs text-purple-400 mt-1 uppercase tracking-widest font-black">Click to upload your PDF</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className={`w-full text-white font-black py-4 px-4 rounded-xl shadow-lg transition-all duration-300 flex justify-center items-center gap-2 tracking-wide
                  ${loading ? 'bg-gray-400 cursor-not-allowed scale-[0.98]' : 'bg-[#6e4ef2] hover:bg-[#5a3edb] hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]'}
                `}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin text-xl" /> AI Extracting Skills...
                  </>
                ) : (
                  "Save Profile & Analyze Resume ✨"
                )}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}