
import React, { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

interface Rule {
    id: number;
    fit_score: string;
    warnings: string[];
    source_diag: string;
    target_diag: string;
}

export default function RulesAdmin() {
    const [rules, setRules] = useState<Rule[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRules = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/rules', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRules(data);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const handleApprove = async (id: number) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/rules/${id}/approve`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                // Remove from list
                setRules(prev => prev.filter(r => r.id !== id));
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="admin-page">
            <header style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ShieldAlert /> Review Rules
                </h1>
                <p style={{ color: '#64748b' }}>Approve fuzzy matches between different screen sizes.</p>
            </header>

            {loading ? (
                <div>Loading pending rules...</div>
            ) : rules.length === 0 ? (
                <div style={{ padding: '40px', background: 'white', borderRadius: '12px', textAlign: 'center', color: '#64748b' }}>
                    <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '10px' }} />
                    <p>No pending rules to review. Good job!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                    {rules.map(rule => (
                        <div key={rule.id} style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Match Score: {parseFloat(rule.fit_score).toFixed(1)}%</h3>
                                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                    Map {rule.source_diag}" Glass → {rule.target_diag}" Phone
                                </p>
                                <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                                    {rule.warnings.map((w, i) => (
                                        <span key={i} style={{ background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                            {w}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => handleApprove(rule.id)}
                                    style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <CheckCircle size={16} /> Approve
                                </button>
                                <button
                                    style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <XCircle size={16} /> Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
