import React, { useState, useEffect } from 'react';

const API_BASE = window.location.origin;

function AlertsTab({ showToast, user }) {
  const [config, setConfig] = useState({
    email_enabled: false,
    target_email: '',
    titer_threshold: 5.0,
    condition: 'above',
    smtp_server: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_pass: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/alert/`, {
        headers: { 'X-User': user || 'testuser' }
      });
      if (res.ok) setConfig(await res.json());
    } catch (e) { console.error('Failed to load alert config'); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/alert/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User': user || 'testuser' },
        body: JSON.stringify(config)
      });
      if (res.ok) showToast('Alert configuration saved!');
      else showToast('Failed to save config', true);
    } catch (err) { showToast('Server error', true); }
    finally { setIsLoading(false); }
  };

  const testAlert = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/alert/test/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User': user || 'testuser' },
        body: JSON.stringify(config)
      });
      if (res.ok) showToast('Test email sent successfully!');
      else showToast('Test failed', true);
    } catch (err) { showToast('Server error during test', true); }
    finally { setIsLoading(false); }
  };

  return (
    <section id="alerts-tab" className="tab-content animate-fade-in">
      <header className="tab-header">
        <h2>🛡️ Process Safeguards & Notifications</h2>
        <p className="caption">Automate bio-process monitoring with threshold-based email alerts.</p>
      </header>
      
      <div className="card glass-panel wide-panel card-emerald">
        <h3 className="section-title">🛡️ Alert Configuration Workspace</h3>
        <form onSubmit={handleSave} className="grid-2col mt-2">
          <div className="input-group">
            <label className="checkbox-label">
              <input type="checkbox" checked={config.email_enabled} onChange={e => setConfig({...config, email_enabled: e.target.checked})} />
              <span>Enable Email Notifications</span>
            </label>
            <label className="mt-1">Target Email Address</label>
            <input type="email" value={config.target_email} onChange={e => setConfig({...config, target_email: e.target.value})} placeholder="engineer@nexus.bio" />
          </div>

          <div className="input-group">
            <label>Titer Threshold (g/L)</label>
            <input type="number" step="0.1" value={config.titer_threshold} onChange={e => setConfig({...config, titer_threshold: parseFloat(e.target.value)})} />
            <label className="mt-1">Condition</label>
            <select value={config.condition} onChange={e => setConfig({...config, condition: e.target.value})}>
              <option value="above">Alert if Titer is ABOVE</option>
              <option value="below">Alert if Titer is BELOW</option>
            </select>
          </div>

          <div className="input-group">
            <label>SMTP Server</label>
            <input type="text" value={config.smtp_server} onChange={e => setConfig({...config, smtp_server: e.target.value})} />
            <label className="mt-1">SMTP Port</label>
            <input type="number" value={config.smtp_port} onChange={e => setConfig({...config, smtp_port: parseInt(e.target.value)})} />
          </div>

          <div className="input-group">
            <label>SMTP User</label>
            <input type="text" value={config.smtp_user} onChange={e => setConfig({...config, smtp_user: e.target.value})} />
            <label className="mt-1">SMTP Password</label>
            <input type="password" value={config.smtp_pass} onChange={e => setConfig({...config, smtp_pass: e.target.value})} />
          </div>

          <div className="flex-stack mt-2" style={{gridColumn: 'span 2', gap: '15px'}}>
            <button type="submit" className="primary-btn" disabled={isLoading}>{isLoading ? '⌛ Saving...' : '💾 Save Configuration'}</button>
            <button type="button" className="outline-btn" onClick={testAlert} disabled={isLoading}>Test Connection</button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default AlertsTab;
