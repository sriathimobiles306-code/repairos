
import React, { useEffect, useState } from 'react';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ totalPhones: 0, activeScreens: 0, pendingRules: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const res = await fetch('/api/admin/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {
                console.error('Failed to fetch stats', err);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="admin-dashboard">
            <h1 style={{ fontSize: '2rem', marginBottom: '10px', color: '#1e293b' }}>Overview</h1>
            <p style={{ color: '#64748b', marginBottom: '30px' }}>Welcome back, Admin. Here is what's happening today.</p>

            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div className="stat-card" style={cardStyle}>
                    <h3 style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '5px' }}>Total Phones</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6366f1' }}>{stats.totalPhones}</div>
                </div>
                <div className="stat-card" style={cardStyle}>
                    <h3 style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '5px' }}>Active Screens</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#a855f7' }}>{stats.activeScreens}</div>
                </div>
                <div className="stat-card" style={cardStyle}>
                    <h3 style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '5px' }}>Pending Rules</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{stats.pendingRules}</div>
                </div>
            </div>
        </div>
    );
}

const cardStyle = {
    background: 'white',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
    border: '1px solid #e2e8f0'
};
