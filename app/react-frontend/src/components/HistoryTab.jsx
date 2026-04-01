import React, { useState, useEffect } from 'react';

const API_BASE = window.location.origin;

function HistoryTab({ showToast, user }) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    loadHistory();
  }, [user, page]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/history/?limit=10&offset=${(page - 1) * 10}`, {
        headers: { 'X-User': user || 'testuser' }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
        // Approximation of total pages based on count (usually count is in header or separate endpoint)
        setTotalPages(Math.max(1, page + (data.length === 10 ? 1 : 0))); 
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to load history', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm(`Are you sure you want to delete Run #${id}?`)) return;
    try {
       const res = await fetch(`${API_BASE}/history/${id}?username=${user}`, { method: 'DELETE' });
       if(res.ok) {
          showToast(`Deleted Run #${id}`);
          loadHistory();
          setSelectedItem(null);
       }
    } catch(e) { showToast('Delete failed', true); }
  };

  return (
    <div className="glass-panel card">
      <div className="content-header">
        <h3>📜 Prediction History</h3>
        <p className="caption">View and manage your past model runs and benchmark results.</p>
      </div>

      <div className="pagination-header mt-2" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <button className="outline-btn pill" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>« Prev</button>
        <span className="caption">Page <strong>{page}</strong></span>
        <button className="outline-btn pill" onClick={() => setPage(p => p+1)} disabled={history.length < 10}>Next »</button>
      </div>

      <div className="table-container mt-1">
        {isLoading ? (
          <div className="spinner"></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Timestamp</th>
                <th>Model</th>
                <th>Summary</th>
                <th>Mode</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map(item => {
                const date = new Date(item.timestamp);
                let resultsRaw = item.result || item.results || '{}';
                let results = resultsRaw;
                if (typeof results === 'string') {
                    try { results = JSON.parse(results); } catch(e) { results = {}; }
                }
                
                let inputsStr = typeof item.inputs === 'string' ? item.inputs : JSON.stringify(item.inputs || {});

                const modelName = (item.model_name || 'Unknown').split('/').pop();
                let meanVal = 'N/A';
                if (Array.isArray(results) && results.length > 0) {
                     meanVal = (results.reduce((a,b)=>a+b,0)/results.length).toFixed(2);
                } else if (results && !Array.isArray(results)) {
                     meanVal = results.mean_pred?.toFixed(2) || results.R2?.toFixed(3) || 'N/A';
                }

                return (
                  <tr key={item.id}>
                    <td>#{item.id}</td>
                    <td style={{color:'#aaa', fontSize:'0.8rem'}}>{date.toLocaleString()}</td>
                    <td>{modelName}</td>
                    <td><span style={{color:'var(--primary-color)'}}>{meanVal}</span></td>
                    <td><span className="pill" style={{background:'rgba(255,255,255,0.05)', fontSize:'0.7rem'}}>{inputsStr.includes('mode":"Benchmark') ? 'Benchmark' : 'Predict'}</span></td>
                    <td>
                       <button className="outline-btn pill" onClick={() => setSelectedItem(item)}>Inspect</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedItem && (
        <div className="mt-2 animate-slide-in" style={{
           background: 'rgba(0,0,0,0.3)', 
           padding: '20px', 
           borderRadius:'12px', 
           border:'1px solid var(--card-border)'
        }}>
           <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
              <h4>🔍 Inspected Run #{selectedItem.id}</h4>
              <button className="outline-btn pill danger" style={{color:'#ff4b4b'}} onClick={() => handleDelete(selectedItem.id)}>Delete Permenantly</button>
           </div>
           <pre style={{
              fontSize:'0.75rem', 
              color:'#0f0', 
              background:'#000', 
              padding:'15px', 
              borderRadius:'8px',
              maxHeight: '300px',
              overflow: 'auto'
           }}>
              {JSON.stringify(selectedItem, null, 2)}
           </pre>
        </div>
      )}

      <button className="outline-btn w-full mt-2">💾 Download Full History (CSV)</button>
    </div>
  );
}

export default HistoryTab;
