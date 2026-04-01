import React, { useState, useEffect } from 'react';

function Sidebar({ activeTab, setActiveTab, onLogout, user, role }) {
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const tabs = [
    { id: 'predict-tab', label: 'Predict & Benchmark', icon: '🚀' },
    { id: 'train-tab', label: 'Train Model', icon: '🏋️‍♂️' },
    { id: 'explore-tab', label: 'Data Exploration', icon: '📊' },
    { id: 'history-tab', label: 'History', icon: '📜' },
    { id: 'guide-tab', label: 'Interpretation Guide', icon: '📘' },
    { id: 'alerts-tab', label: 'Alert Configuration', icon: '🔔' },
    { id: 'health-tab', label: 'System Health', icon: '🖥️' },
  ];

  if (role === 'admin') {
    tabs.push({ id: 'admin-tab', label: 'Admin Management', icon: '🔑' });
  }

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.body.className = nextTheme === 'dark' ? 'dark-theme' : 'light-theme';
  };

  const startRecording = async () => {
     try {
       const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
       const recorder = new MediaRecorder(stream);
       let chunks = [];
       recorder.ondataavailable = e => chunks.push(e.data);
       recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'bionexus_session.webm';
          a.click();
       };
       recorder.start();
       setMediaRecorder(recorder);
       setIsRecording(true);
     } catch(e) { console.error('Recorder failed:', e); }
  };

  const stopRecording = () => {
     if(mediaRecorder) {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(t => t.stop());
        setIsRecording(false);
     }
  };

  return (
    <aside className={`sidebar glass-panel ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-branding">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
           {!collapsed && <h2 className="gradient-text">BioNexus ML</h2>}
           <button className="outline-btn pill" onClick={() => setCollapsed(!collapsed)} style={{padding:'5px', minWidth:'30px'}}>
              {collapsed ? '»' : '«'}
           </button>
        </div>
        {!collapsed && <span className="version-tag">Version: 3.78-FINAL</span>}
      </div>
      
      {!collapsed && (
        <div className="user-profile mt-2">
           <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
              <span style={{fontSize:'1.8rem'}}>👤</span>
              <div>
                 <strong>{user}</strong><br/>
                 <span className="caption" style={{fontSize:'0.7rem', textTransform:'uppercase'}}>{role} access</span>
              </div>
           </div>
        </div>
      )}

      <nav className="sidebar-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
          >
            <span className="icon">{tab.icon}</span>
            {!collapsed && <span className="label">{tab.label}</span>}
          </button>
        ))}
      </nav>

      {!collapsed && (
        <div className="sidebar-group mt-2" style={{padding:'10px 5px'}}>
           <h3 style={{fontSize:'1.2rem', marginBottom:'15px', color:'var(--text-color)', borderBottom:'none', paddingBottom:'0'}}>🎨 Appearance</h3>
           <div style={{display:'flex', flexDirection:'column', marginBottom:'25px'}}>
              <span style={{fontWeight:'bold', fontSize:'0.95rem', color:'var(--text-color)'}}>Theme</span>
              <span style={{fontSize:'0.95rem', marginBottom:'8px', color:'var(--text-color)', fontWeight:'500'}}>{theme === 'dark' ? 'Dark' : 'Light'}</span>
              <input 
                 type="range" 
                 min="0" max="1" step="1"
                 value={theme === 'dark' ? 1 : 0} 
                 onChange={toggleTheme}
                 style={{
                   accentColor: '#ff4b4b', 
                   cursor: 'pointer', 
                   height: '4px',
                   background: 'rgba(200,200,200,0.3)',
                   borderRadius: '2px',
                   outline: 'none',
                   WebkitAppearance: 'none'
                 }}
              />
           </div>

           <h3 style={{fontSize:'1.2rem', marginBottom:'15px', color:'var(--text-color)', borderBottom:'none', paddingBottom:'0'}}>📸 Screen Recorder</h3>
           <div style={{display:'flex', gap:'10px'}}>
              <button 
                 style={{
                   background:'#28a745', color:'#fff', border:'none', padding:'8px 18px', 
                   borderRadius:'6px', display:'flex', alignItems:'center', gap:'6px', 
                   fontSize:'0.95rem', fontWeight:'bold', cursor: isRecording ? 'not-allowed' : 'pointer',
                   opacity: isRecording ? 0.6 : 1
                 }} 
                 onClick={startRecording} 
                 disabled={isRecording}
              >
                 <div style={{width:'8px', height:'8px', background:'#fff', borderRadius:'50%'}}></div>
                 Start
              </button>
              <button 
                 style={{
                   background:'#dc3545', color:'#fff', border:'none', padding:'8px 18px', 
                   borderRadius:'6px', display:'flex', alignItems:'center', gap:'6px', 
                   fontSize:'0.95rem', fontWeight:'bold', cursor: !isRecording ? 'not-allowed' : 'pointer',
                   opacity: !isRecording ? 0.6 : 1
                 }} 
                 onClick={stopRecording} 
                 disabled={!isRecording}
              >
                 <div style={{width:'8px', height:'8px', background:'#fff'}}></div>
                 Stop
              </button>
           </div>
        </div>
      )}
      
      <button className="secondary-btn mt-2" onClick={onLogout} style={{width:'100%', borderColor:'rgba(255,0,0,0.3)'}}>
         {collapsed ? '💨' : 'Logout System'}
      </button>
      
      {!collapsed && (
         <details className="mt-1" style={{cursor:'pointer', padding:'5px'}}>
            <summary className="caption" style={{fontSize:'0.7rem', fontWeight:'bold'}}>🛠 DIAGNOSTICS</summary>
            <div className="caption" style={{fontSize:'0.65rem', marginTop:'8px', paddingLeft:'10px'}}>
               API Status: <span style={{color:'var(--success)'}}>ONLINE</span><br/>
               Build: AWS_RELEASE_37
            </div>
         </details>
      )}
    </aside>
  );
}

export default Sidebar;
