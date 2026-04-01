import React, { useState } from 'react';

const API_BASE = window.location.origin;

function Auth({ onLogin, showToast }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [regMessage, setRegMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        onLogin(username, data.role || 'user');
      } else {
        setError(data.detail || 'Invalid credentials.');
      }
    } catch (err) {
      setError('Server connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setRegMessage('');
    setError('');
    
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email, name })
      });
      const data = await res.json();
      
      if (res.ok) {
        setRegMessage('Registration successful! Awaiting admin approval.');
        setTimeout(() => {
          setIsRegistering(false);
        }, 3000);
      } else {
        setError(data.detail || 'Registration failed.');
      }
    } catch (err) {
      setError('Server connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="branding">
      <h1 className="gradient-text">BioNexus ML</h1>
      <p className="subtitle">Bioprocess Intelligence Dashboard</p>
      <div className="line-accent"></div>
      
      {!isRegistering ? (
        <form onSubmit={handleLogin}>
          <div className="floating-input-group">
            <input 
              type="text" id="username" required 
              placeholder=" "
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <label htmlFor="username">Username</label>
          </div>
          <div className="floating-input-group">
            <input 
              type={showPassword ? "text" : "password"} id="password" required 
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label htmlFor="password">Password</label>
            <button 
              type="button" 
              className="toggle-password" 
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? "👁️‍🗨️" : "👁️"}
            </button>
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="primary-btn mt-2 full-width" disabled={isLoading}>
            {isLoading ? '⌛ Logging in...' : 'Log In'}
          </button>
          <p className="caption text-center mt-2">
            Don't have an account? <a href="#" onClick={(e) => {e.preventDefault(); setIsRegistering(true)}} style={{color:'var(--primary-color)'}}>Register here</a>
          </p>
        </form>
      ) : (
        <form onSubmit={handleRegister}>
          <div className="floating-input-group">
            <input 
              type="text" id="reg-name" required 
              placeholder=" "
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <label htmlFor="reg-name">Full Name</label>
          </div>
          <div className="floating-input-group">
            <input 
              type="text" id="reg-username" required 
              placeholder=" "
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <label htmlFor="reg-username">Username</label>
          </div>
          <div className="floating-input-group">
            <input 
              type={showPassword ? "text" : "password"} id="reg-password" required 
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label htmlFor="reg-password">Password</label>
            <button 
              type="button" 
              className="toggle-password" 
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? "👁️‍🗨️" : "👁️"}
            </button>
          </div>
          <div className="floating-input-group">
            <input 
              type="email" id="reg-email" 
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label htmlFor="reg-email">Email (Optional)</label>
          </div>
          {error && <div className="error-msg">{error}</div>}
          {regMessage && <div className="success-text mt-1">{regMessage}</div>}
          <button type="submit" className="primary-btn mt-2 full-width" disabled={isLoading}>
            {isLoading ? '⌛ Registering...' : 'Register'}
          </button>
          <p className="caption text-center mt-2">
            Already have an account? <a href="#" onClick={(e) => {e.preventDefault(); setIsRegistering(false)}} style={{color:'var(--primary-color)'}}>Log In</a>
          </p>
        </form>
      )}
    </div>
  );
}

export default Auth;
