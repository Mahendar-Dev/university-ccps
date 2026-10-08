import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, UploadCloud, MapPin, Clock, CheckCircle, Radio, BrainCircuit } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion } from 'framer-motion';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function LocationPicker({ position, setPosition, setLocation }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      setLocation(`${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`);
    },
  });
  return position === null ? null : (
    <Marker position={position}><Popup>New Incident Location</Popup></Marker>
  );
}

export default function ThreatMap({ authKey, userRole }) {
  const [incidents, setIncidents] = useState([]);
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [file, setFile] = useState(null);
  
  const [isDeploying, setIsDeploying] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('All');
  
  const [mapPosition, setMapPosition] = useState(null);
  const [aiStrategies, setAiStrategies] = useState({});
  const [isAiLoading, setIsAiLoading] = useState({});

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 15000);
    return () => clearInterval(interval);
  }, [authKey]);

  const fetchIncidents = async () => {
    try {
      const response = await axios.get(`${API_URL}/incidents`, {
        headers: { 'X-Auth-Key': authKey }
      });
      const sorted = response.data.sort((a, b) => {
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
      setIncidents(sorted);
    } catch (error) {
      console.error("Failed to fetch incidents:", error);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsDeploying(true);
    try {
      let imageUrl = "";

      if (file) {
        const urlRes = await axios.get(`${API_URL}/generate-upload-url`, {
          params: { filename: file.name, filetype: file.type },
          headers: { 'X-Auth-Key': authKey }
        });
        const { upload_url, url } = urlRes.data;
        
        await axios.put(upload_url, file, {
          headers: { 'Content-Type': file.type }
        });
        imageUrl = url;
      }

      await axios.post(`${API_URL}/incidents`, { 
        title, severity, description, location, image_url: imageUrl 
      }, {
        headers: { 'X-Auth-Key': authKey }
      });
      
      if (severity.toLowerCase() === 'critical') {
        alert("🚨 EMERGENCY PROTOCOL INITIATED: Alerts dispatched to response units!");
      }
      
      setTitle('');
      setSeverity('Medium');
      setDescription('');
      setLocation('');
      setFile(null);
      await fetchIncidents();
    } catch (error) {
      console.error(error);
      alert("Deployment failed. Ensure backend API and permissions are configured.");
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/incidents/${id}`, {
        headers: { 'X-Auth-Key': authKey }
      });
      fetchIncidents();
    } catch (error) {
      console.error(error);
      alert("Failed to resolve incident. Only Admins can resolve.");
    }
  };

  const filteredIncidents = filterSeverity === 'All' 
    ? incidents 
    : incidents.filter(inc => (inc.severity || '').toLowerCase() === filterSeverity.toLowerCase());

  const generateStrategy = async (inc) => {
    setIsAiLoading(prev => ({ ...prev, [inc.id]: true }));
    try {
      const response = await axios.post(`${API_URL}/ai/strategy`, {
        title: inc.title || 'Unknown',
        description: inc.description || 'No description',
        severity: inc.severity || 'Medium',
        location: inc.location || 'Unknown'
      }, { headers: { 'X-Auth-Key': authKey } });
      setAiStrategies(prev => ({ ...prev, [inc.id]: response.data.strategy }));
    } catch (err) {
      setAiStrategies(prev => ({ ...prev, [inc.id]: "AI generation failed." }));
    } finally {
      setIsAiLoading(prev => ({ ...prev, [inc.id]: false }));
    }
  };

  const parseCoords = (locStr) => {
    if (!locStr) return null;
    const parts = locStr.split(',');
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
    }
    return null;
  };

  return (
    <motion.div 
      className="app-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="header-container" style={{ marginBottom: '2rem' }}>
        <h2 className="header-title" style={{ fontSize: '2.5rem' }}>Active Threat Map</h2>
        <p className="header-subtitle">Log new hazards and monitor global incidents.</p>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleCreate} className="form-grid">
          <div className="input-group">
            <label className="input-label">Incident Title</label>
            <input type="text" className="input-field" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Category 5 Hurricane" />
          </div>
          <div className="input-group">
            <label className="input-label">Severity Level</label>
            <select className="input-field" value={severity} onChange={e => setSeverity(e.target.value)}>
              <option value="Critical">Critical (Immediate Alert)</option>
              <option value="High">High (Major Risk)</option>
              <option value="Medium">Medium (Standard Log)</option>
            </select>
          </div>
          <div className="input-group" style={{ gridColumn: 'span 2' }}>
            <label className="input-label">Location / Coordinates</label>
            <input type="text" className="input-field" value={location} onChange={e => setLocation(e.target.value)} required placeholder="e.g. Miami Coastline" />
          </div>
          <div className="input-group" style={{ gridColumn: 'span 2' }}>
            <label className="input-label">Situation Report (SITREP)</label>
            <textarea className="input-field" rows="3" value={description} onChange={e => setDescription(e.target.value)} required placeholder="Provide detailed field assessment..."></textarea>
          </div>

          <div style={{ gridColumn: 'span 2', height: '300px', borderRadius: '16px', overflow: 'hidden', marginBottom: '1rem', border: '1px solid var(--border)' }}>
            <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationPicker position={mapPosition} setPosition={setMapPosition} setLocation={setLocation} />
              {filteredIncidents.map(inc => {
                const coords = parseCoords(inc.location);
                if (coords) return (
                  <Marker key={inc.id} position={coords}>
                    <Popup>{inc.title}</Popup>
                  </Marker>
                );
                return null;
              })}
            </MapContainer>
          </div>
          
          <div className="upload-zone" onClick={() => document.getElementById('file-upload').click()}>
            <input id="file-upload" type="file" style={{display: 'none'}} onChange={handleFileChange} accept="image/*" />
            <UploadCloud size={40} color="var(--accent-blue)" />
            {file ? (
              <div style={{ fontWeight: 600 }}>File Selected: {file.name}</div>
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>Click to upload damage assessment imagery (S3 Direct)</div>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={isDeploying}>
            {isDeploying ? <><Radio className="animate-spin" size={20} /> Transmitting...</> : <><Target size={20} /> Log Incident</>}
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <label className="input-label">Filter Sector:</label>
        <select 
          className="input-field" 
          style={{ width: '200px' }}
          value={filterSeverity} 
          onChange={(e) => setFilterSeverity(e.target.value)}
        >
          <option value="All">All Incidents</option>
          <option value="Critical">Critical Only</option>
          <option value="High">High Only</option>
          <option value="Medium">Medium Only</option>
        </select>
      </div>

      <div className="incidents-grid">
        {filteredIncidents.map(inc => {
          const safeSeverity = inc.severity || 'Medium';
          const safeTitle = inc.title || inc.name || 'Unknown Incident';
          const safeLocation = inc.location || 'Unknown Sector';
          const formattedTime = inc.timestamp ? new Date(inc.timestamp).toLocaleString() : 'System Reboot';
          const reporter = inc.reporter_id || 'UNKNOWN-OP';
          
          return (
            <div key={inc.id} className={`incident-card severity-${safeSeverity.toLowerCase()}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <span className="incident-title">{safeTitle}</span>
                <span className={`badge badge-${safeSeverity.toLowerCase()}`}>{safeSeverity}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}><MapPin size={16} /> {safeLocation}</span>
                <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>OP: {reporter}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} /> {formattedTime}
              </div>
              {inc.image_url && <img src={inc.image_url} alt="Tactical" className="incident-image" />}
              <div className="incident-desc">{inc.description}</div>
              
              <button 
                className="btn-primary" 
                style={{ background: 'var(--bg-glass)', border: '1px solid var(--accent-blue)', color: 'var(--accent-blue)', marginTop: '1rem', width: '100%' }}
                onClick={() => generateStrategy(inc)}
                disabled={isAiLoading[inc.id]}
              >
                {isAiLoading[inc.id] ? <><Radio className="animate-spin" size={18} /> Generating...</> : <><BrainCircuit size={18} /> AI Response Strategy</>}
              </button>
              
              {aiStrategies[inc.id] && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', fontSize: '0.9rem', borderLeft: '3px solid var(--accent-blue)' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-main)' }}>AI Strategy:</div>
                  <div style={{ color: 'var(--text-muted)' }}>{aiStrategies[inc.id]}</div>
                </div>
              )}
              
              {userRole === "Admin" && (
                <button 
                  className="btn-primary" 
                  style={{ background: 'transparent', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', marginTop: '1rem', width: '100%' }}
                  onClick={() => handleDelete(inc.id)}
                >
                  <CheckCircle size={18} /> Resolve Incident
                </button>
              )}
            </div>
          );
        })}
        {filteredIncidents.length === 0 && (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)' }}>
            No incidents reported in this sector.
          </div>
        )}
      </div>
    </motion.div>
  );
}
