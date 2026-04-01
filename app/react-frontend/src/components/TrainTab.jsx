import React, { useState, useRef } from 'react';

const API_BASE = window.location.origin;

function TrainTab({ showToast }) {
  const [targetCol, setTargetCol] = useState('Product_Titer_gL');
  const [modelName, setModelName] = useState('model_custom.joblib');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleTrain = async (e) => {
    e.preventDefault();
    if (!selectedFile) return showToast('Upload training CSV', true);
    
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('target_col', targetCol);
    formData.append('model_name', modelName);
    
    try {
      const res = await fetch(`${API_BASE}/train/`, { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        showToast(`Training complete! R2: ${data.r2_score.toFixed(4)}`);
      } else {
        showToast(data.detail || 'Training failed', true);
      }
    } catch(e) { 
      showToast('Server error', true); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section>
      <header className="tab-header">
        <h2>🏋️‍♂️ Train a New Model</h2>
        <p className="caption">Upload labeled data to train a new RidgeCV pipeline. This will save a .joblib model and a .json schema.</p>
      </header>
      <div className="glass-panel card">
        <div 
          className="upload-area" 
          onClick={() => fileInputRef.current.click()}
        >
          <p>{selectedFile ? `Selected: ${selectedFile.name}` : 'Upload Training CSV (labeled data)'}</p>
          <input 
            type="file" ref={fileInputRef} hidden accept=".csv" 
            onChange={(e) => setSelectedFile(e.target.files[0])} 
          />
          <button className="outline-btn mt-1">Browse Files</button>
        </div>
        <div className="grid-2col mt-2">
          <div className="input-group">
            <label>Target Column</label>
            <input type="text" value={targetCol} onChange={e => setTargetCol(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Model Name</label>
            <input type="text" value={modelName} onChange={e => setModelName(e.target.value)} />
          </div>
        </div>
        <button className="primary-btn mt-2" onClick={handleTrain} disabled={isLoading}>
          {isLoading ? '⌛ Training...' : '🔥 Start Training'}
        </button>
      </div>
    </section>
  );
}

export default TrainTab;
