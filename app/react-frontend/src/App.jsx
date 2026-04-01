import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import PredictTab from './components/PredictTab';
import HistoryTab from './components/HistoryTab';
import AlertsTab from './components/AlertsTab';
import AdminTab from './components/AdminTab';
import TrainTab from './components/TrainTab';
import ExploreTab from './components/ExploreTab';
import GuideTab from './components/GuideTab';
import HealthTab from './components/HealthTab';

const API_BASE = window.location.origin;

function SummaryBar({ latestData, windowRange, setWindowRange }) {
  if (!latestData || !latestData.inputs) return null;
  const inputs = latestData.inputs;
  const keys = Object.keys(inputs);
  const findCol = (pattern) => keys.find(k => k.toLowerCase().includes(pattern.toLowerCase()));
  const getAvg = (col) => {
    const arr = inputs[col] || [];
    if (!arr.length) return '--';
    const vals = arr
      .map(v => parseFloat(v))
      .filter(v => typeof v === 'number' && !isNaN(v));
    if (!vals.length) return '--';
    return (vals.reduce((a,b)=>a+b, 0) / vals.length).toFixed(2);
  };
  
  const temp = findCol('Temp'), ph = findCol('pH'), do2 = findCol('Oxygen'), titer = findCol('Titer');

  return (
    <div className="summary-ticker glass-panel animate-slide-in">
       <div className="ticker-item"><span className="label">ACTIVE FILE:</span> <strong>{latestData.filename || 'Batch_Run.csv'}</strong></div>
       <div className="ticker-item"><span className="label">AVG TEMP:</span> <strong>{getAvg(temp)}°C</strong></div>
       <div className="ticker-item"><span className="label">AVG pH:</span> <strong>{getAvg(ph)}</strong></div>
       
       <div className="global-scroller">
          <div className="scroller-controls">
            <button className="outline-btn pill" onClick={() => setWindowRange([0, 100])}>««</button>
            <button className="outline-btn pill" onClick={() => {
                   const start = Math.max(0, windowRange[0] - 10);
                   setWindowRange([start, Math.min(start+100, latestData.count)]);
                 }}>«</button>
            <input type="range" min="0" max={Math.max(0, latestData.count - 100)} value={windowRange[0]} onChange={e => {
                     const start = parseInt(e.target.value);
                     setWindowRange([start, Math.min(start + 100, latestData.count)]);
                   }} className="full-width" />
            <button className="outline-btn pill" onClick={() => {
                    const start = Math.min(latestData.count - 100, windowRange[0] + 10);
                    setWindowRange([start, start + 100]);
                 }}>»</button>
            <button className="outline-btn pill" onClick={() => {
                    const start = Math.max(0, latestData.count - 100);
                    setWindowRange([start, latestData.count]);
                 }}>»»</button>
          </div>
          <span className="caption text-center">Batch Window: {windowRange[0]} - {windowRange[1]}</span>
       </div>

       <div className="ticker-item"><span className="label">AVG DO:</span> <strong>{getAvg(do2)}%</strong></div>
       <div className="ticker-item"><span className="label">AVG TITER:</span> <strong className="gradient-text">{getAvg(titer)} g/L</strong></div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('user');
  const [activeTab, setActiveTab] = useState('predict-tab');
  const [toast, setToast] = useState(null);
  const [latestData, setLatestData] = useState(null);
  const [windowRange, setWindowRange] = useState([0, 100]);

  useEffect(() => {
    const savedUser = localStorage.getItem('bn_user');
    const savedRole = localStorage.getItem('bn_role');
    if (savedUser) {
      setUser(savedUser);
      setRole(savedRole || 'user');
    }
  }, []);

  const handleUpdateLatestData = (newData) => {
      setLatestData(newData);
      if (newData) setWindowRange([0, Math.min(100, newData.count)]);
  };

  const showToast = (message, isError = false) => {
    setToast({ message, id: Date.now(), isError });
    setTimeout(() => setToast(null), 3000);
  };
  
  // ... rest of App logic

  const handleLogin = (username, userRole) => {
    setUser(username);
    setRole(userRole);
    localStorage.setItem('bn_user', username);
    localStorage.setItem('bn_role', userRole);
    showToast('Login successful!');
  };

  const handleLogout = () => {
    setUser(null);
    setRole('user');
    localStorage.removeItem('bn_user');
    localStorage.removeItem('bn_role');
  };

  if (!user) {
    return (
      <div className="auth-wrapper">
        <div className="ambient-orb orb-1"></div>
        <div className="ambient-orb orb-2"></div>
        <div className="auth-centered">
          <Auth onLogin={handleLogin} showToast={showToast} />
        </div>
        {toast && (
          <div className="toast-container">
            <div className={`toast animate-slide-in ${toast.isError ? 'error-toast' : ''}`}>
              {toast.message}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
        user={user} 
        role={role} 
      />
      
      <main className="dashboard-content">
        <SummaryBar latestData={latestData} windowRange={windowRange} setWindowRange={setWindowRange} />
        <div className="tab-container">
            {activeTab === 'predict-tab' && <PredictTab showToast={showToast} setLatestData={handleUpdateLatestData} latestData={latestData} user={user} windowRange={windowRange} />}
            {activeTab === 'history-tab' && <HistoryTab showToast={showToast} user={user} setLatestData={handleUpdateLatestData} />}
            {activeTab === 'explore-tab' && <ExploreTab latestData={latestData} setLatestData={handleUpdateLatestData} windowRange={windowRange} setWindowRange={setWindowRange} />}
            {activeTab === 'alerts-tab' && <AlertsTab showToast={showToast} user={user} />}
            {activeTab === 'admin-tab' && <AdminTab showToast={showToast} currentUser={user} />}
            {activeTab === 'train-tab' && <TrainTab showToast={showToast} />}
            {activeTab === 'guide-tab' && <GuideTab />}
            {activeTab === 'health-tab' && <HealthTab />}
        </div>
      </main>

      {toast && (
        <div className="toast-container">
          <div className={`toast animate-slide-in ${toast.isError ? 'error-toast' : ''}`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
