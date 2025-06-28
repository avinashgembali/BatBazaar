import React, { useState } from 'react';
import '../styles/login.css';
import useAuthStore from '../../useAuthStore';
import { toast } from 'react-toastify'; // ✅ Import toast

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [regData, setRegData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const validateEmail = (email) => {
    return email.includes('@') && email.includes('.');
  };

  const validatePassword = (password) => {
    const re = /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/;
    return re.test(password);
  };

  const register = async () => {
    const { username, email, password, confirmPassword } = regData;

    if (!username || !email || !password || !confirmPassword) {
      toast.error('Please fill all fields.');
      return;
    }

    if (username.length < 3) {
      toast.error('Username should be at least 3 characters long.');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (!validatePassword(password)) {
      toast.error('Password must be at least 6 characters, including one letter and one number.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    try {
      const response = await fetch('https://batbazaar.onrender.com/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Registration successful! Please log in.');
        setIsRegister(false);
      } else {
        toast.error(data.message || 'Registration failed.');
      }
    } catch (err) {
      toast.error('Registration failed. Try again later.');
    }
  };

  const login = async () => {
    const { email, password } = loginData;

    if (!email || !password) {
      toast.error('Please fill in both fields.');
      return;
    }

    try {
      const response = await fetch('https://batbazaar.onrender.com/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        useAuthStore.getState().login(data.user);
        toast.success('Login successful!');
        window.location.href = '/'; // Can be replaced with navigate
      } else {
        toast.error(data.message || 'Invalid email or password');
      }
    } catch (err) {
      toast.error('Login failed. Please try again later.');
    }
  };

  return (
    <div className="login-page">
      <div className="container">
        {isRegister ? (
          <>
            <h1>Create an Account 🏏</h1>
            <input
              type="text"
              placeholder="Enter your username"
              value={regData.username}
              onChange={(e) => setRegData({ ...regData, username: e.target.value })}
            />
            <input
              type="email"
              placeholder="Enter your email"
              value={regData.email}
              onChange={(e) => setRegData({ ...regData, email: e.target.value })}
            />
            <input
              type="password"
              placeholder="Create a password"
              value={regData.password}
              onChange={(e) => setRegData({ ...regData, password: e.target.value })}
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={regData.confirmPassword}
              onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
            />
            <button className="register-btn" onClick={register}>Register</button>
            <p>Already have an account? <button onClick={() => setIsRegister(false)}>Login</button></p>
          </>
        ) : (
          <>
            <h1>Welcome to BatBazaar 🏏</h1>
            <input
              type="email"
              placeholder="Enter your email"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
            />
            <input
              type="password"
              placeholder="Enter your password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            />
            <button className="login-btn" onClick={login}>Login</button>
            <p>New User? <button onClick={() => setIsRegister(true)}>Register Here</button></p>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
