import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, AlertTriangle, ShieldAlert, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function Analytics({ authKey }) {
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    if (authKey) {
      axios.get(`${API_URL}/incidents`, { headers: { 'X-Auth-Key': authKey } })
        .then(res => setIncidents(res.data))
        .catch(err => console.error(err));
    }
  }, [authKey]);

  const stats = useMemo(() => {
    let critical = 0, high = 0, medium = 0;
    incidents.forEach(inc => {
      const s = (inc.severity || 'Medium').toLowerCase();
      if (s === 'critical') critical++;
      if (s === 'high') high++;
      if (s === 'medium') medium++;
    });
    return { total: incidents.length, critical, high, medium };
  }, [incidents]);

  const pieData = [
    { name: 'Critical', value: stats.critical, color: '#ef4444' },
    { name: 'High', value: stats.high, color: '#f59e0b' },
    { name: 'Medium', value: stats.medium, color: '#0ea5e9' }
  ];

  const timelineData = useMemo(() => {
    const counts = {};
    incidents.forEach(inc => {
      if (inc.timestamp) {
        const dateStr = String(inc.timestamp).substring(0, 10);
        counts[dateStr] = (counts[dateStr] || 0) + 1;
      }
    });
    const sortedDates = Object.keys(counts).sort();
    return sortedDates.map(date => ({ date, count: counts[date] }));
  }, [incidents]);

  if (!authKey) {
    return (
      <div className="app-container" style={{ textAlign: 'center', marginTop: '10vh' }}>
        <h2 className="header-title">Please Log In</h2>
        <p className="header-subtitle">Analytics are restricted to authorized personnel.</p>
      </div>
    );
  }

  const exportPDF = () => {
    const input = document.getElementById('analytics-dashboard');
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('AEGIS_Analytics_Report.pdf');
    });
  };

  return (
    <motion.div 
      className="app-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      id="analytics-dashboard"
    >
      <div className="header-container" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="header-title" style={{ fontSize: '2.5rem' }}>Grid Analytics</h2>
          <p className="header-subtitle">Real-time incident distribution and metrics.</p>
        </div>
        <button className="btn-primary" onClick={exportPDF} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Download size={18} /> Export PDF
        </button>
      </div>

      <div className="analytics-grid">
        <div className="stat-card" style={{ borderTop: '4px solid #0ea5e9' }}>
          <Activity size={40} color="#0ea5e9" style={{ margin: '0 auto 1rem' }}/>
          <div className="stat-value" style={{ color: '#0ea5e9' }}>{stats.total}</div>
          <div className="stat-label">Total Logs</div>
        </div>

        <div className="stat-card" style={{ borderTop: '4px solid #ef4444' }}>
          <ShieldAlert size={40} color="#ef4444" style={{ margin: '0 auto 1rem' }}/>
          <div className="stat-value" style={{ color: '#ef4444' }}>{stats.critical}</div>
          <div className="stat-label">Critical Alerts</div>
        </div>

        <div className="stat-card" style={{ borderTop: '4px solid #f59e0b' }}>
          <AlertTriangle size={40} color="#f59e0b" style={{ margin: '0 auto 1rem' }}/>
          <div className="stat-value" style={{ color: '#f59e0b' }}>{stats.high}</div>
          <div className="stat-label">High Priority</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="chart-container" style={{ minHeight: '300px' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-main)' }}>Severity Distribution</h3>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container" style={{ minHeight: '300px' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-main)' }}>Incident Timeline</h3>
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={timelineData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} allowDecimals={false} />
                <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No timeline data available
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
