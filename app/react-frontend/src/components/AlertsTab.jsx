import React, { useState, useEffect } from 'react';

const API_BASE = window.location.origin;

function AlertsTab({ showToast, user }) {
  const [config, setConfig] = useState({
    email_enabled: false,
    target_email: '',
    titer_threshold: 5.0,
    condition: 'above',
    smtp_server: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: '',
    smtp_pass: '',
    email_provider: 'smtp',
    api_key: ''
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
      if (res.ok) {
        const data = await res.json();
        // Merge with defaults to ensure all fields exist
        setConfig(prev => ({...prev, ...data}));
      }
    } catch (e) { console.error('Failed to load alert config'); }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
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
      else showToast('Test failed. Check your API key or SMTP settings.', true);
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
        
        <form onSubmit={handleSave} className="mt-2">
          <div className="grid-2col">
            <div className="input-group">
              <label className="checkbox-label mb-1">
                <input type="checkbox" checked={config.email_enabled} onChange={e => setConfig({...config, email_enabled: e.target.checked})} />
                <strong>Enable Alerts</strong>
              </label>
              <label>Target Email Address</label>
              <input type="email" value={config.target_email || ''} onChange={e => setConfig({...config, target_email: e.target.value})} placeholder="engineer@nexus.bio" />
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
          </div>

          <hr className="divider mt-2 mb-2" />

          <div className="provider-selector glass-panel p-1 mb-2">
            <label className="caption mb-1 block">SELECT EMAIL PROVIDER</label>
            <div className="flex-row gap-2">
              <button 
                type="button" 
                className={`pill-btn ${config.email_provider === 'smtp' ? 'active' : ''}`}
                onClick={() => setConfig({...config, email_provider: 'smtp'})}
              >
                Standard SMTP (Local/Paid)
              </button>
              <button 
                type="button" 
                className={`pill-btn ${config.email_provider === 'resend' ? 'active' : ''}`}
                onClick={() => setConfig({...config, email_provider: 'resend'})}
              >
                Resend API (Render Cloud)
              </button>
            </div>
          </div>

          {config.email_provider === 'resend' ? (
            <div className="input-group animate-slide-in">
              <label>Resend API Key</label>
              <input 
                type="password" 
                value={config.api_key || ''} 
                onChange={e => setConfig({...config, api_key: e.target.value})} 
                placeholder="re_xxxxxxxxxxxxxxxxxxx" 
              />
              <p className="caption mt-1">Recommended for Render Free Tier deployments to bypass port blocks.</p>
            </div>
          ) : (
            <div className="grid-2col animate-slide-in">
              <div className="input-group">
                <label>SMTP Server</label>
                <input type="text" value={config.smtp_server || ''} onChange={e => setConfig({...config, smtp_server: e.target.value})} />
                <label className="mt-1">SMTP Port</label>
                <input type="number" value={config.smtp_port} onChange={e => setConfig({...config, smtp_port: parseInt(e.target.value)})} />
              </div>
              <div className="input-group">
                <label>SMTP User</label>
                <input type="text" value={config.smtp_user || ''} onChange={e => setConfig({...config, smtp_user: e.target.value})} />
                <label className="mt-1">SMTP Password</label>
                <input type="password" value={config.smtp_pass || ''} onChange={e => setConfig({...config, smtp_pass: e.target.value})} />
              </div>
            </div>
          )}

          <div className="flex-stack mt-2 gap-2">
            <button type="submit" className="primary-btn" disabled={isLoading}>{isLoading ? '⌛ Saving...' : '💾 Save Configuration'}</button>
            <button type="button" className="outline-btn" onClick={testAlert} disabled={isLoading}>🚀 Send Test Email</button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default AlertsTab;
