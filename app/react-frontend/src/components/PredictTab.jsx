import React, { useState, useEffect, useRef } from 'react';
import { Line, Scatter, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE = window.location.origin;

function PredictTab({ showToast, setLatestData, latestData, user, windowRange = [0, 100] }) {
  const [modelChoice, setModelChoice] = useState('model_ridgecv.joblib');
  const [schemaChoice, setSchemaChoice] = useState('feature_schema.json');
  const [customModelPath, setCustomModelPath] = useState('');
  const [mode, setMode] = useState('predict');
  const [useSample, setUseSample] = useState(false);
  const [useThreads, setUseThreads] = useState(false);
  const [batchSize, setBatchSize] = useState(5000);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUseSample(false);
    }
  };

  const handleRun = async () => {
    if (!useSample && !selectedFile) return showToast('Please upload a CSV or use sample dataset.', true);
    
    setIsLoading(true);
    setResults(null);
    
    const actualModel = modelChoice === 'Custom...' ? customModelPath : modelChoice;
    
    let url = `${API_BASE}/predict/?model_name=${encodeURIComponent(actualModel)}&schema_name=${encodeURIComponent(schemaChoice)}`;
    if (useSample) url += `&use_sample=true`;
    
    let requestOptions = {
      method: 'POST',
      headers: { 'X-User': user || 'testuser' }
    };

    if (!useSample) {
      const formData = new FormData();
      formData.append('file', selectedFile);
      requestOptions.body = formData;
    }
    
    try {
      const res = await fetch(url, requestOptions);
      const data = await res.json();
      
      if (res.ok) {
          setResults(data);
          setLatestData(data);
          showToast(`Success: Processed ${data.count} rows`);
      } else {
          showToast(data.detail || 'Prediction failed', true);
      }
    } catch (err) {
      showToast('Backend connection failed', true);
    } finally {
      setIsLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#fff' } } },
    scales: { 
      x: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  };

  const distributionData = results ? {
    labels: Array.from({length: 20}, (_, i) => i), // Simplified binning
    datasets: [{
      label: 'Prediction Spread',
      data: results.results.slice(0, 50), // Mocked for display
      backgroundColor: 'rgba(0, 209, 255, 0.4)',
      borderColor: '#00d1ff',
      borderWidth: 1
    }]
  } : null;

  return (
    <section id="predict-tab">
      <div className="content-header">
        <h3>Predict results or benchmark model performance</h3>
        <p className="caption">Use saved sklearn Pipeline model artifacts (.joblib) and schema (.json) to predict Product_Titer_gL from process data.</p>
      </div>

      <div className="dashboard-grid mt-2">
        {/* Configuration Card */}
        <div className="card glass-panel card-cyan">
          <h3 className="section-title">⚙️ Configuration</h3>
          
          <div className="input-group">
            <label>Select Model</label>
            <select value={modelChoice} onChange={(e) => setModelChoice(e.target.value)}>
              <option value="model_ridgecv.joblib">RidgeCV (Default)</option>
              <option value="model_gbr.joblib">Gradient Boosting</option>
              <option value="model_linear.joblib">Linear Model</option>
              <option value="model_custom.joblib">Custom Model</option>
              <option value="Custom...">Custom Path...</option>
            </select>
          </div>

          <div className="input-group">
            <label>Select Schema</label>
            <select value={schemaChoice} onChange={(e) => setSchemaChoice(e.target.value)}>
              <option value="feature_schema.json">Default Schema (feature_schema.json)</option>
              <option value="feature_schema_custom.json">Custom Schema (feature_schema_custom.json)</option>
            </select>
          </div>

          {modelChoice === 'Custom...' && (
            <div className="input-group">
              <label>Model Path</label>
              <input type="text" value={customModelPath} onChange={(e) => setCustomModelPath(e.target.value)} placeholder="models/custom.joblib" />
            </div>
          )}

          <div className="radio-group mb-1">
             <label className={`radio-label ${mode === 'predict' ? 'selected' : ''}`}>
                <input type="radio" value="predict" checked={mode === 'predict'} onChange={() => setMode('predict')} /> Predict
             </label>
             <label className={`radio-label ${mode === 'benchmark' ? 'selected' : ''}`}>
                <input type="radio" value="benchmark" checked={mode === 'benchmark'} onChange={() => setMode('benchmark')} /> Benchmark
             </label>
          </div>

          <div className="input-group mt-1">
             <label className="checkbox-label">
                <input type="checkbox" checked={useThreads} onChange={(e) => setUseThreads(e.target.checked)} />
                <span>🧵 Threaded Prediction</span>
             </label>
          </div>

          {useThreads && (
            <div className="input-group">
              <label>Batch Size</label>
              <select value={batchSize} onChange={(e) => setBatchSize(parseInt(e.target.value))}>
                <option value="100">100</option>
                <option value="500">500</option>
                <option value="1000">1000</option>
                <option value="5000">5000</option>
              </select>
            </div>
          )}

          <button className="primary-btn w-full mt-2" onClick={handleRun} disabled={isLoading}>
            {isLoading ? '⌛ DEPLOYING...' : '▶ RUN ENGINE'}
          </button>
        </div>

        {/* Input Data Card */}
        <div className="card glass-panel">
          <h3 className="section-title">📥 Input Data</h3>
          <div className="upload-area" onClick={() => !useSample && fileInputRef.current.click()}>
            <p>{useSample ? '🔗 Using Data Sample' : (selectedFile ? `✅ ${selectedFile.name}` : 'Drag and drop CSV here')}</p>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
          </div>
          
          <div className="input-group mt-1">
             <label className="checkbox-label">
                <input type="checkbox" checked={useSample} onChange={(e) => {
                    setUseSample(e.target.checked);
                    if(e.target.checked) setSelectedFile(null);
                }} />
                <span>Use local sample library (bioreactor_ml_dataset.csv)</span>
             </label>
          </div>

          {results && (
            <div id="results-display" className="mt-2 animate-slide-in">
                <div className="metric-box">
                  <span className="metric-label tooltip-wrapper" data-tooltip="The average expected Product Titer output for this entire batch of predictive inputs.">Predicted Mean Yield ⓘ</span>
                  <h2 className="metric-val">
                    {(() => {
                        const m = results.metrics?.mean_yield;
                        if (typeof m === 'number') return m.toFixed(2);
                        if (results.results?.length > 0) {
                            const avg = results.results.reduce((a, b) => a + (Number(b) || 0), 0) / results.results.length;
                            return avg.toFixed(2);
                        }
                        return '0.00';
                    })()} g/L
                  </h2>
                </div>
                {mode === 'benchmark' && results.metrics && (
                  <div className="metrics-subgrid mt-1" style={{display: 'flex', gap: '15px'}}>
                    <div className="metric-box">
                      <span className="metric-label tooltip-wrapper" data-tooltip="Variance completely explained by inputs. 0.8+ is generally considered excellent.">Test R² ⓘ</span>
                      <h2 className="metric-val" style={{fontSize: '1.4rem'}}>{parseFloat(results.metrics.r2).toFixed(4)}</h2>
                    </div>
                    <div className="metric-box">
                      <span className="metric-label tooltip-wrapper" data-tooltip="Mean Absolute Error: The average 'miss' distance between predicted and actual values in real units (g/L).">MAE (g/L) ⓘ</span>
                      <h2 className="metric-val" style={{fontSize: '1.4rem'}}>{parseFloat(results.metrics.mae).toFixed(4)}</h2>
                    </div>
                    <div className="metric-box">
                      <span className="metric-label tooltip-wrapper" data-tooltip="Root Mean Squared Error: Extremely sensitive to outliers. High RMSE means the model makes rare but large mistakes.">RMSE (g/L) ⓘ</span>
                      <h2 className="metric-val" style={{fontSize: '1.4rem'}}>{parseFloat(results.metrics.rmse).toFixed(4)}</h2>
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {results && (
        <div className="grid-2col mt-2 animate-slide-in">
           <div className="card glass-panel card-emerald">
              <h3>📊 Distribution</h3>
              <div className="chart-flex" style={{height:'300px'}}>
                  <Bar data={distributionData} options={chartOptions} />
              </div>
           </div>
           
           <div className="card glass-panel">
              <h3>📜 Results Preview (Top 100)</h3>
              <div className="table-container" style={{maxHeight:'300px'}}>
                  <table>
                      <thead><tr><th>ID</th><th>Predicted Titer</th></tr></thead>
                      <tbody>
                          {results.results.slice(0, 100).map((val, i) => (
                             <tr key={i}><td>{i+1}</td><td><strong style={{color:'var(--primary-color)'}}>{val.toFixed(3)}</strong> g/L</td></tr>
                          ))}
                      </tbody>
                  </table>
              </div>
              <button className="secondary-btn w-full mt-1">⬇️ Download predictions.csv</button>
           </div>
        </div>
      )}
    </section>
  );
}

export default PredictTab;
