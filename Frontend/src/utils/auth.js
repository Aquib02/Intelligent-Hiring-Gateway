export const getAuthToken = () => localStorage.getItem('access_token');

export const getAuthUser = () => {
  const role = localStorage.getItem('role');
  return {
    userId: localStorage.getItem('user_id'),
    role: role === 'employee' ? 'jobseeker' : role,
    email: localStorage.getItem('user_email'),
    name: localStorage.getItem('user_name'),
  };
};

export const setAuthSession = ({ access_token, user_id, role, email, name }) => {
  if (access_token) localStorage.setItem('access_token', access_token);
  if (user_id) localStorage.setItem('user_id', user_id);
  const normalizedRole = role === 'employee' ? 'jobseeker' : role;
  if (normalizedRole) localStorage.setItem('role', normalizedRole);
  if (email) localStorage.setItem('user_email', email);
  if (name) localStorage.setItem('user_name', name);
};

export const clearAuthSession = () => {
  localStorage.clear();
};

export const isAuthenticated = () => {
  return Boolean(localStorage.getItem('user_id') || localStorage.getItem('access_token'));
};

export const hasRole = (allowedRoles) => {
  const currentRole = localStorage.getItem('role');
  const normalized = currentRole === 'employee' ? 'jobseeker' : currentRole;
  const allowed = allowedRoles.map(r => r === 'employee' ? 'jobseeker' : r);
  return allowed.includes(normalized);
};
