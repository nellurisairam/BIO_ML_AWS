import React, { useState, useEffect } from 'react';

const API_BASE = window.location.origin;

function HealthTab() {
  const [health, setHealth] = useState({ cpu: 0, ram: 0, db_latency: 0, models_count: 0 });
  const [logs, setLogs] = useState('Loading logs...');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`);
        const data = await res.json();
        setHealth(data);
        
        const logRes = await fetch(`${API_BASE}/api/logs`);
        const logData = await logRes.json();
        setLogs(logData.logs);
      } catch (err) {
        console.error('Error fetching health:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 10000); // 10s refresh
    return () => clearInterval(interval);
  }, []);

  const handleClearLogs = async () => {
     if(window.confirm('Are you sure you want to clear the system logs?')) {
        await fetch(`${API_BASE}/api/logs`, { method: 'DELETE' });
        setLogs('Logs cleared.');
     }
  };

  return (
    <section id="health-tab" className="tab-content active">
      <div className="content-header">
        <h2>🖥️ System Health & Monitoring</h2>
        <p className="caption">Real-time operational metrics and application logs.</p>
      </div>

      <div className="metric-row mt-2">
        <div className="metric-box glass-panel card-cyan">
          <span className="metric-label">CPU Usage</span>
          <h2 className="metric-val">{health.cpu}%</h2>
        </div>
        <div className="metric-box glass-panel card-cyan">
          <span className="metric-label">Memory Usage</span>
          <h2 className="metric-val">{health.ram}%</h2>
        </div>
        <div className="metric-box glass-panel card-cyan">
          <span className="metric-label">DB Latency</span>
          <h2 className="metric-val">{health.db_latency} ms</h2>
        </div>
      </div>

      <div className="card glass-panel wide-panel mt-2">
        <div className="header-row" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h3>📜 Application Logs (app.log)</h3>
          <button className="outline-btn pill danger" style={{color:'#ff4d4f', borderColor:'#ff4d4f'}} onClick={handleClearLogs}>🗑️ Clear Logs</button>
        </div>
        <div className="log-viewer mt-2" style={{
           background: '#000', 
           color: '#0f0', 
           padding: '20px', 
           borderRadius: '8px', 
           height: '400px', 
           overflowY: 'auto', 
           fontFamily: 'monospace',
           fontSize: '0.85rem'
        }}>
          <pre style={{whiteSpace: 'pre-wrap', wordBreak: 'break-all'}}>{logs}</pre>
        </div>
      </div>
    </section>
  );
}

export default HealthTab;
