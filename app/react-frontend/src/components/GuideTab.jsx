import React from 'react';

function GuideTab() {
  return (
    <section id="guide-tab" className="tab-content active">
      <div className="content-header">
        <h2>📘 Bioprocessor's Analytics Masterclass</h2>
        <p className="caption">Welcome to the deep-dive guide. This section bridges the gap between <strong>Data Science</strong> and <strong>Bioprocess Engineering</strong>, helping you turn mathematical graphs into actionable lab decisions.</p>
      </div>

      <div className="guide-grid mt-2">
        {/* Section 1 */}
        <div className="card glass-panel card-cyan">
          <h3 className="section-title">🎯 1. Model Performance (Actual vs. Predicted)</h3>
          <div className="guide-row">
            <div className="guide-col">
              <h4>🔬 The Science</h4>
              <p>In biology, "Noise" is constant. A model that tracks every dot perfectly is often <strong>overfit</strong>. We look for a model that captures the underlying metabolic trend.</p>
              <h4>📊 How to Read</h4>
              <ul className="guide-list">
                <li><strong>Identity Line</strong>: Close dots mean the model understands your process.</li>
                <li><strong>Bias Check</strong>: Consistent deviation suggests under or over prediction.</li>
              </ul>
            </div>
            <div className="guide-col info-panel mt-1">
              <h4>🛠️ Action Plan</h4>
              <div className="error-border mb-1">
                 <strong>Low R² (&lt;0.6)</strong>: Inputs don't explain yield enough. Look for <em>Media Lot Variation</em> or <em>Inoculum Quality</em>.
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="card glass-panel card-orange">
          <h3 className="section-title">💡 2. Critical Process Parameters (Feature Importance)</h3>
          <div className="guide-row">
            <div className="guide-col">
              <h4>🔬 The Science</h4>
              <p>Bioreactors are non-linear. Importance shows which variable is the <strong>limiting factor</strong> for production.</p>
              <h4>📊 How to Read</h4>
               <ul className="guide-list">
                <li><strong>Top Bars</strong>: Your "Levers" with the biggest impact.</li>
                <li><strong>Negative Importance</strong>: Increasing this variable hurts yield.</li>
              </ul>
            </div>
            <div className="guide-col info-panel mt-1">
              <h4>🛠️ Action Plan</h4>
              <div className="success-border mb-1">
                <strong>Optimization</strong>: If "Agitation" is high, process is <strong>Oxygen Limited</strong>. Increase RPM to unlock growth.
              </div>
            </div>
          </div>
        </div>

        {/* Section 3 */}
        <div className="card glass-panel card-magenta">
          <h3 className="section-title">🔥 3. Parameter Correlations (The Heatmap)</h3>
          <div className="guide-row">
            <div className="guide-col">
              <h4>🔬 The Science</h4>
              <p>Variables are rarely independent. Henry's Law dictates that as Temp rises, Oxygen solubility drops.</p>
              <h4>📊 How to Read</h4>
              <ul className="guide-list">
                <li><strong>Deep Red (+1.0)</strong>: Perfect coupling.</li>
                <li><strong>Deep Blue (-1.0)</strong>: Inverse relationship (e.g. Growth vs Glucose).</li>
              </ul>
            </div>
            <div className="guide-col info-panel mt-1">
              <div className="info-border mb-1">
                <strong>Sensor Health</strong>: No correlation between expected variables suggests a fouled probe or equipment failure.
              </div>
            </div>
          </div>
        </div>

        {/* Section 4 */}
        <div className="card glass-panel card-emerald">
          <h3 className="section-title">📊 4. Distribution & Stability (Boxplots)</h3>
          <div className="guide-row">
            <div className="guide-col">
              <h4>🔬 The Science</h4>
              <p>Consistency is the goal. Distributions show "Natural Variation" across runs.</p>
              <h4>📊 How to Read</h4>
               <ul className="guide-list">
                <li><strong>The Box</strong>: Represents the 50% "Expected" range.</li>
                <li><strong>Outliers</strong>: Batches where something went "Wrong".</li>
              </ul>
            </div>
            <div className="guide-col info-panel mt-1">
               <div className="error-border mb-1">
                <strong>Root Cause Analysis</strong>: Inspect outliers to prevent future batch losses. Focus on standardization.
              </div>
            </div>
          </div>
        </div>
      </div>

       <div className="card glass-panel wide-panel mt-2">
           <h3>📖 Glossary of Metrics</h3>
           <div className="guide-four-col">
               <div className="guide-box">
                  <strong>R-Squared (R²)</strong>
                  <p className="caption">Yield variation explained by inputs. 0.8+ is excellent.</p>
               </div>
               <div className="guide-box">
                  <strong>MAE</strong>
                  <p className="caption">Mean Absolute Error. The 'Average Miss' in real units (g/L).</p>
               </div>
               <div className="guide-box">
                  <strong>RMSE</strong>
                  <p className="caption">Penalizes large errors heavily.</p>
               </div>
               <div className="guide-box">
                  <strong>CPPs</strong>
                  <p className="caption">Critical Process Parameters.</p>
               </div>
           </div>
       </div>
    </section>
  );
}

export default GuideTab;
