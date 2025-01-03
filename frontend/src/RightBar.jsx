import React, { useState } from 'react';
import './RightBar.css';

const RightBar = ({ onBBoxClick, currentZoom, bounds, onToggleOverlay, showOverlay }) => {
  const [layers, setLayers] = useState([
    { id: 'hospital', name: 'Hospital', active: true },
    { id: 'school', name: 'School', active: false },
  ]);
  const [newLayerName, setNewLayerName] = useState('');

  const toggleLayer = (id) => {
    setLayers(layers.map(layer => 
      layer.id === id ? { ...layer, active: !layer.active } : layer
    ));
  };

  const addLayer = () => {
    if (newLayerName.trim()) {
      setLayers([...layers, { id: Date.now().toString(), name: newLayerName, active: true }]);
      setNewLayerName('');
    }
  };

  return (
    <div className="right-bar">
      <section className="tool-section">
        <h3>Drawing Tools</h3>
        <div className="button-group">
          <button onClick={onBBoxClick} className="tool-button" title="Get Bounding Box">
            <h5>BBOX</h5>
          </button>
          <button onClick={onToggleOverlay} className="tool-button" title="Toggle Overlay">
            <h5>{showOverlay ? 'Hide Overlay' : 'Show Overlay'}</h5>
          </button>
        </div>
      </section>
      
      <section className="layer-section">
        <h3>Layers</h3>
        <ul className="layer-list">
          {layers.map(layer => (
            <li key={layer.id} className="layer-item">
              <label className="layer-label">
                <input
                  type="checkbox"
                  checked={layer.active}
                  onChange={() => toggleLayer(layer.id)}
                />
                {layer.name}
              </label>
              <button className="layer-visibility" title={layer.active ? "Hide Layer" : "Show Layer"}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {layer.active ? (
                    <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></>
                  ) : (
                    <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></>
                  )}
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </section>
      
      <section className="add-layer-section">
        <h3>Add Data Layer</h3>
        <div className="add-layer-form">
          <input
            type="text"
            value={newLayerName}
            onChange={(e) => setNewLayerName(e.target.value)}
            placeholder="Layer name"
          />
          <button onClick={addLayer} className="add-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>
      </section>
      
      <button className="clear-button">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        Clear All
      </button>
    </div>
  );
};

export default RightBar;
