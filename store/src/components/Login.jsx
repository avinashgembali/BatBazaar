import { useState } from 'react';
import '../styles/login.css';
import useAuthStore from '../../useAuthStore';
import { toast } from 'react-toastify';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [regData, setRegData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  const validateEmail = (email) => email.includes('@') && email.includes('.');
  const validatePassword = (password) => /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/.test(password);

  const register = async () => {
    const { username, email, password, confirmPassword } = regData;
    if (!username || !email || !password || !confirmPassword) { toast.error('Please fill all fields.'); return; }
    if (username.length < 3) { toast.error('Username should be at least 3 characters.'); return; }
    if (!validateEmail(email)) { toast.error('Please enter a valid email address.'); return; }
    if (!validatePassword(password)) { toast.error('Password must be 6+ characters with a letter and number.'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match.'); return; }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      if (response.ok) { toast.success('Registration successful! Please log in.'); setIsRegister(false); }
      else toast.error(data.message || 'Registration failed.');
    } catch { toast.error('Registration failed. Try again later.'); }
  };

  const login = async () => {
    const { email, password } = loginData;
    if (!email || !password) { toast.error('Please fill in both fields.'); return; }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) { useAuthStore.getState().login(data.user); toast.success('Login successful!'); window.location.href = '/'; }
      else toast.error(data.message || 'Invalid email or password');
    } catch { toast.error('Login failed. Please try again later.'); }
  };

  return (
    <div className="login-page">
      <div className="login-brand">
        <div className="brand-content">
          <h1>BatBazaar<span>🏏</span></h1>
          <p>India's premier destination for professional cricket bats.</p>
          <div className="brand-stats">
            <div><strong>500+</strong><span>Bats</span></div>
            <div><strong>50+</strong><span>Brands</span></div>
            <div><strong>4.8★</strong><span>Rating</span></div>
          </div>
        </div>
      </div>

      <div className="login-form-panel">
        <div className="form-card">
          <div className="form-tabs">
            <button className={!isRegister ? 'tab active' : 'tab'} onClick={() => setIsRegister(false)}>Login</button>
            <button className={isRegister ? 'tab active' : 'tab'} onClick={() => setIsRegister(true)}>Register</button>
          </div>

          {isRegister ? (
            <div className="form-fields">
              <h2>Create Account</h2>
              <input type="text" placeholder="Username" value={regData.username} onChange={(e) => setRegData({ ...regData, username: e.target.value })} />
              <input type="email" placeholder="Email address" value={regData.email} onChange={(e) => setRegData({ ...regData, email: e.target.value })} />
              <input type="password" placeholder="Create a password" value={regData.password} onChange={(e) => setRegData({ ...regData, password: e.target.value })} />
              <input type="password" placeholder="Confirm password" value={regData.confirmPassword} onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })} />
              <button className="submit-btn" onClick={register}>Create Account</button>
            </div>
          ) : (
            <div className="form-fields">
              <h2>Welcome back</h2>
              <input type="email" placeholder="Email address" value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} />
              <input type="password" placeholder="Password" value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} />
              <button className="submit-btn" onClick={login}>Login</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
