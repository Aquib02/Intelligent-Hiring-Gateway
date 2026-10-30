import { Navigate, Link } from 'react-router-dom';
import { isAuthenticated, hasRole, getAuthUser } from '../utils/auth';
import { FaShieldAlt, FaArrowRight, FaLock } from 'react-icons/fa';

export default function ProtectedRoute({ children, allowedRoles }) {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    const user = getAuthUser();
    const correctPath = user.role === 'recruiter' ? '/recruiter/dashboard' : '/jobseeker/dashboard';

    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 border border-red-500/30 shadow-2xl text-center">
          <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">
            <FaLock />
          </div>
          <h2 className="text-2xl font-black mb-2">Access Restricted (RBAC)</h2>
          <p className="text-slate-400 text-sm mb-6">
            Your current account role is <span className="text-purple-400 font-bold uppercase">{user.role}</span>. You do not have permission to access the <span className="text-red-400 font-bold uppercase">{allowedRoles.join(', ')}</span> portal.
          </p>
          <Link
            to={correctPath}
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition shadow-lg shadow-purple-600/30"
          >
            Go to My Authorized Dashboard <FaArrowRight />
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
