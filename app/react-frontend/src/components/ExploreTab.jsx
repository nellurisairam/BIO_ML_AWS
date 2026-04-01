import React, { useState } from 'react';
import { Line, Scatter, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

function ExploreTab({ latestData, setLatestData, windowRange = [0, 100], setWindowRange }) {
  const [selectedParams, setSelectedParams] = useState(['Temperature_C', 'pH']);
  const [phaseX, setPhaseX] = useState('Temperature_C');
  const [phaseY, setPhaseY] = useState('pH');
  const [distParam, setDistParam] = useState('Glucose_gL');
  const [maximizedCard, setMaximizedCard] = useState(null);
  
  const toggleMaximize = (cardId) => {
     setMaximizedCard(maximizedCard === cardId ? null : cardId);
  };
  const handleLoadSample = async () => {
    try {
      const res = await fetch(`${window.location.origin}/api/data/sample`);
      if (res.ok) {
        const data = await res.json();
        const rows = data.content.split('\n').filter(r => r.trim());
        const headers = rows[0].split(',').map(h => h.trim());
        const dataRows = rows.slice(1).map(r => r.split(','));
        const inputs = {};
        headers.forEach((h, i) => {
          inputs[h] = dataRows.map(row => parseFloat(row[i]) || 0);
        });
        
        // Quick correlation matrix calculation
        const cols = Object.keys(inputs);
        const corrs = {};
        cols.forEach(c1 => {
            corrs[c1] = {};
            cols.forEach(c2 => {
                const v1 = inputs[c1], v2 = inputs[c2], n = v1.length;
                const sum1 = v1.reduce((a,b)=>a+b, 0), sum2 = v2.reduce((a,b)=>a+b, 0);
                const sum1Sq = v1.reduce((a,b)=>a+b*b, 0), sum2Sq = v2.reduce((a,b)=>a+b*b, 0);
                const pSum = v1.reduce((acc, v, i) => acc + v * v2[i], 0);
                const num = pSum - (sum1 * sum2 / n);
                const den = Math.sqrt((sum1Sq - sum1*sum1/n) * (sum2Sq - sum2*sum2/n));
                corrs[c1][c2] = den === 0 ? 0 : num / den;
            });
        });

        setLatestData({
          inputs,
          count: dataRows.length,
          correlations: corrs,
          filename: data.filename
        });
        setWindowRange([0, Math.min(100, dataRows.length)]);
      }
    } catch(e) { console.error(e); }
  };

  if (!latestData) {
    return (
      <section>
        <header className="tab-header">
          <h2 className="gradient-text">🔍 Process Data Exploration</h2>
          <p className="caption">Deep dive into your bioprocess parameters before or after prediction.</p>
        </header>
        <div id="no-explore-state" className="glass-panel text-center" style={{padding: '80px 50px', border: '1px dashed var(--card-border)'}}>
          <div style={{fontSize: '3rem', marginBottom: '20px'}}>🧪</div>
          <h3>Analytical Workspace is Idle</h3>
          <p style={{fontSize: '1.1rem', opacity: 0.7, maxWidth: '500px', margin: '15px auto'}}>
            To begin deep-dive exploration, you need to load a dataset. You can either upload your own CSV in the <strong>Predict</strong> tab or use our pre-loaded Golden Batch sample.
          </p>
          <div style={{display:'flex', gap:'15px', justifyContent:'center', marginTop:'30px'}}>
             <button className="primary-btn" onClick={handleLoadSample}>Load Sample Data</button>
             <p className="caption" style={{margin:'auto 0'}}>— or —</p>
             <button className="outline-btn" onClick={() => window.location.hash = '#predict-tab'}>Go to Predict Tab</button>
          </div>
        </div>
      </section>
    );
  }

  const inputs = latestData.inputs || {};
  const keys = Object.keys(inputs);
  const findCol = (pattern) => keys.find(k => k.toLowerCase().includes(pattern.toLowerCase()));
  const tempCol = findCol('Temp');
  const phCol = findCol('pH');
  const doCol = findCol('Oxygen');
  const titerCol = findCol('Titer');

  const getStats = (arr) => {
    if (!arr || !arr.length) return { avg: '--', min: '--', max: '--', std: '--' };
    const vals = arr
      .map(v => parseFloat(v))
      .filter(v => typeof v === 'number' && !isNaN(v));
    if (!vals.length) return { avg: '--', min: '--', max: '--', std: '--' };
    
    const avg = vals.reduce((a,b)=>a+b, 0) / vals.length;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const sqDiffs = vals.map(v => Math.pow(v - avg, 2));
    const std = Math.sqrt(sqDiffs.reduce((a,b)=>a+b, 0) / vals.length);
    return { avg: avg.toFixed(2), min: min.toFixed(2), max: max.toFixed(2), std: std.toFixed(2) };
  };

  const labels = (inputs[keys[0]] || []).slice(windowRange[0], windowRange[1]);
  const colors = ['#00d1ff', '#ff00ff', '#00ffaa', '#ffaa00', '#ffffff', '#aa00ff'];

  const lineChartData = {
    labels: labels.map((_, i) => i + windowRange[0]),
    datasets: selectedParams.map((p, idx) => {
      const col = findCol(p);
      return {
        label: col || p,
        data: (inputs[col] || []).slice(windowRange[0], windowRange[1]),
        borderColor: colors[idx % colors.length],
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 0
      };
    })
  };

  const scatterData = {
    datasets: [{
      label: `${phaseX} vs ${phaseY}`,
      data: (inputs[phaseX] || []).map((v, i) => ({ x: v, y: inputs[phaseY]?.[i] })),
      backgroundColor: 'rgba(0, 209, 255, 0.5)',
      pointRadius: 3
    }]
  };

  const getAvg = (col) => {
    const arr = inputs[col] || [];
    if (!arr.length) return '--';
    const vals = arr
      .map(v => parseFloat(v))
      .filter(v => typeof v === 'number' && !isNaN(v));
    if (!vals.length) return '--';
    return (vals.reduce((a,b)=>a+b, 0) / vals.length).toFixed(2);
  };

  const renderDistribution = () => {
    const data = inputs[distParam] || [];
    if (!data.length) return null;
    const bins = 20;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    const binSize = range / bins;
    const frequencies = new Array(bins).fill(0);
    data.forEach(v => {
      let idx = Math.floor((v - min) / binSize);
      if (idx === bins) idx--;
      frequencies[idx]++;
    });
    
    return {
      labels: Array.from({length: bins}, (_, i) => (min + i * binSize).toFixed(1)),
      datasets: [{
        label: 'Frequency',
        data: frequencies,
        backgroundColor: 'rgba(0, 255, 170, 0.4)',
        borderColor: '#00ffaa',
        borderWidth: 1
      }]
    };
  };

  const distData = renderDistribution();

  const renderHeatmap = () => {
    if (!latestData.correlations) return null;
    const corrs = latestData.correlations;
    const displayKeys = Object.keys(corrs).slice(0, 10);
    
    return (
      <div className="heatmap-container" style={{overflow:'auto', background: 'rgba(0,0,0,0.2)', padding:'10px', borderRadius:'8px'}}>
        <table className="heatmap-table">
          <thead>
            <tr>
              <th></th>
              {displayKeys.map(k => <th key={k} title={k}>{k.substring(0,6)}</th>)}
            </tr>
          </thead>
          <tbody>
            {displayKeys.map(k1 => (
              <tr key={k1}>
                <th title={k1}>{k1.substring(0,10)}</th>
                {displayKeys.map(k2 => {
                  const val = corrs[k1][k2];
                  let bgColor = val > 0 ? `rgba(0, 209, 255, ${Math.abs(val)})` : `rgba(255, 100, 100, ${Math.abs(val)})`;
                  if (k1 === k2) bgColor = 'rgba(255,255,255,0.1)';
                  return <td key={k2} style={{background: bgColor}}>{(val||0).toFixed(2)}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <section>
      <header className="tab-header">
        <h2 className="gradient-text">🔍 Process Data Exploration</h2>
        <p className="caption">Advanced visualization and auditing of bioprocess parameters.</p>
      </header>

      <div className="metric-row">
        <div className="metric-box box-glow"><span className="metric-label">Avg Temp</span><h4 className="metric-val">{tempCol ? getStats(inputs[tempCol]).avg : '--'} °C</h4></div>
        <div className="metric-box box-glow"><span className="metric-label">Avg pH</span><h4 className="metric-val">{phCol ? getStats(inputs[phCol]).avg : '--'}</h4></div>
        <div className="metric-box box-glow"><span className="metric-label">Avg DO</span><h4 className="metric-val">{doCol ? getStats(inputs[doCol]).avg : '--'} %</h4></div>
        <div className="metric-box box-glow"><span className="metric-label">Avg Titer</span><h4 className="metric-val">{titerCol ? getStats(inputs[titerCol]).avg : '--'} g/L</h4></div>
      </div>

      <div className="grid-2col mt-2">
        <div className={`glass-panel card card-orange ${maximizedCard === 'corr' ? 'maximized' : ''}`}>
          <h3 className="section-title">
             <span>🔥 Parameter Correlations</span>
             <button className="outline-btn pill" onClick={() => toggleMaximize('corr')}>
                {maximizedCard === 'corr' ? '✖' : '⛶'}
             </button>
          </h3>
          {renderHeatmap()}
          {!maximizedCard && <p className="caption mt-1">Identifies dependent variables and metabolic coupling.</p>}
        </div>

        <div className={`glass-panel card card-cyan ${maximizedCard === 'trends' ? 'maximized' : ''}`}>
          <h3 className="section-title">
             <span>📈 Time-Series Trends</span>
             <button className="outline-btn pill" onClick={() => toggleMaximize('trends')}>
                {maximizedCard === 'trends' ? '✖' : '⛶'}
             </button>
          </h3>
          <div className="flex-row">
            <select multiple className="compact-select" value={selectedParams} onChange={e => setSelectedParams(Array.from(e.target.selectedOptions).map(o => o.value))}>
              {keys.slice(0, 15).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <div className="chart-flex">
              <Line 
                data={lineChartData} 
                options={{ 
                  responsive: true, maintainAspectRatio: false,
                  scales: { x: { ticks: { color: '#888' } }, y: { ticks: { color: '#888' } } },
                  plugins: { legend: { labels: { color: '#fff', boxWidth: 10 } } }
                }} 
              />
              <div className="range-scrubber mt-1" style={{display:'flex', alignItems:'center', gap:'10px'}}>
                 <select className="compact-select pill" style={{width:'80px', padding:'2px 8px', fontSize:'0.8rem'}} value={windowRange[1]-windowRange[0]} onChange={e => {
                    const size = parseInt(e.target.value);
                    const start = windowRange[0];
                    setWindowRange([start, Math.min(latestData.count, start + size)]);
                 }}>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={500}>500</option>
                    <option value={1000}>1k</option>
                    <option value={latestData.count || 5000}>All</option>
                 </select>
                 <button className="outline-btn pill" onClick={() => {
                    const size = windowRange[1] - windowRange[0];
                    setWindowRange([0, size]);
                 }}>««</button>
                 <button className="outline-btn pill" onClick={() => {
                   const size = windowRange[1] - windowRange[0];
                   const start = Math.max(0, windowRange[0] - Math.max(1, Math.floor(size/10)));
                   setWindowRange([start, Math.min(start+size, latestData.count)]);
                 }}>«</button>
                 <div style={{flex:1}}>
                   <label className="caption">Samples {windowRange[0]} - {windowRange[1]}</label>
                   <input type="range" min="0" max={Math.max(0, latestData.count - (windowRange[1]-windowRange[0]))} value={windowRange[0]} onChange={e => {
                     const size = windowRange[1] - windowRange[0];
                     const start = parseInt(e.target.value);
                     setWindowRange([start, Math.min(start + size, latestData.count)]);
                   }} className="full-width" />
                 </div>
                 <button className="outline-btn pill" onClick={() => {
                    const size = windowRange[1] - windowRange[0];
                    const start = Math.min(latestData.count - size, windowRange[0] + Math.max(1, Math.floor(size/10)));
                    setWindowRange([Math.max(0, start), Math.min(latestData.count, Math.max(0, start) + size)]);
                 }}>»</button>
                 <button className="outline-btn pill" onClick={() => {
                    const size = windowRange[1] - windowRange[0];
                    const start = Math.max(0, latestData.count - size);
                    setWindowRange([start, latestData.count]);
                 }}>»»</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2col mt-2">
        <div className={`glass-panel card card-magenta ${maximizedCard === 'phase' ? 'maximized' : ''}`}>
          <h3 className="section-title">
             <span>⚖️ Phase Plot (Parameter Relationships)</span>
             <button className="outline-btn pill" onClick={() => toggleMaximize('phase')}>
                {maximizedCard === 'phase' ? '✖' : '⛶'}
             </button>
          </h3>
          <div className="flex-stack">
            <div className="input-group-row">
              <select value={phaseX} onChange={e => setPhaseX(e.target.value)}>{keys.map(k => <option key={k} value={k}>X: {k}</option>)}</select>
              <select value={phaseY} onChange={e => setPhaseY(e.target.value)}>{keys.map(k => <option key={k} value={k}>Y: {k}</option>)}</select>
            </div>
            <div className="chart-flex" style={{height: maximizedCard === 'phase' ? '70vh' : 'auto'}}>
              <Scatter 
                data={scatterData}
                options={{
                  responsive: true, maintainAspectRatio: false,
                  scales: { x: { ticks: { color: '#888' } }, y: { ticks: { color: '#888' } } },
                  plugins: { legend: { display: false } }
                }}
              />
            </div>
          </div>
        </div>

        <div className={`glass-panel card card-emerald ${maximizedCard === 'dist' ? 'maximized' : ''}`}>
          <h3 className="section-title">
             <span>📊 Parameter Distribution</span>
             <button className="outline-btn pill" onClick={() => toggleMaximize('dist')}>
                {maximizedCard === 'dist' ? '✖' : '⛶'}
             </button>
          </h3>
          <div className="flex-stack">
            <select value={distParam} onChange={e => setDistParam(e.target.value)}>{keys.map(k => <option key={k} value={k}>{k}</option>)}</select>
            <div className="chart-flex" style={{height: maximizedCard === 'dist' ? '70vh' : 'auto'}}>
              {distData && <Bar 
                data={distData}
                options={{
                  responsive: true, maintainAspectRatio: false,
                  scales: { x: { ticks: { color: '#888' } }, y: { ticks: { color: '#888' } } },
                  plugins: { legend: { display: false } }
                }}
              />}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel card mt-2 overflow-auto">
        <h3 className="section-title">🧾 Summary Statistics Table</h3>
        <table className="stats-table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Mean</th>
              <th>Min</th>
              <th>Max</th>
              <th>Std Dev</th>
            </tr>
          </thead>
          <tbody>
            {keys.map(k => {
              const stats = getStats(inputs[k]);
              return (
                <tr key={k}>
                  <td>{k}</td>
                  <td>{stats.avg}</td>
                  <td>{stats.min}</td>
                  <td>{stats.max}</td>
                  <td>{stats.std}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ExploreTab;
