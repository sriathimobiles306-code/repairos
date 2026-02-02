
import React, { useEffect, useState } from 'react';
import { Link, CheckCircle, ArrowRight } from 'lucide-react';

export default function ModelMapper() {
    const [phones, setPhones] = useState<any[]>([]);
    const [screens, setScreens] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedPhone, setSelectedPhone] = useState<string>('');
    const [selectedScreen, setSelectedScreen] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const adminToken = localStorage.getItem('adminToken');
            const headers = { 'Authorization': `Bearer ${adminToken}` };

            const [phonesRes, screensRes] = await Promise.all([
                fetch('/api/admin/unmapped-phones', { headers }),
                fetch('/api/admin/all-screens', { headers })
            ]);

            if (phonesRes.ok && screensRes.ok) {
                setPhones(await phonesRes.json());
                setScreens(await screensRes.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleMap = async () => {
        if (!selectedPhone || !selectedScreen) return;
        setSubmitting(true);
        setMessage(null);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/map-phone', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    modelId: parseInt(selectedPhone),
                    screenId: parseInt(selectedScreen)
                })
            });

            if (!res.ok) throw new Error('Failed to map');

            setMessage({ type: 'success', text: 'Linked successfully!' });

            // Remove the mapped phone from the list
            setPhones(prev => prev.filter(p => p.id !== parseInt(selectedPhone)));
            setSelectedPhone('');
            setSelectedScreen('');

        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to create link.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="admin-page">
            <header style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Link /> map Phones to Screens
                </h1>
                <p style={{ color: '#64748b' }}>Link a physical phone model to its screen profile.</p>
            </header>

            <div className="card" style={{ background: 'white', padding: '30px', borderRadius: '12px', maxWidth: '800px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>

                {message && (
                    <div style={{
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
                        color: message.type === 'success' ? '#059669' : '#dc2626'
                    }}>
                        {message.text}
                    </div>
                )}

                {loading ? (
                    <div>Loading data...</div>
                ) : phones.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '10px' }} />
                        <p>All phones are mapped! Great job.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', alignItems: 'center' }}>

                        {/* PHONE SELECTOR */}
                        <div>
                            <label style={labelStyle}>Select Phone (Unmapped)</label>
                            <select
                                value={selectedPhone}
                                onChange={(e) => setSelectedPhone(e.target.value)}
                                style={inputStyle}
                                size={10}
                            >
                                {phones.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.brand_name} {p.name}
                                    </option>
                                ))}
                            </select>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '5px' }}>{phones.length} phones pending.</p>
                        </div>

                        {/* ARROW */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                            <ArrowRight size={24} color="#94a3b8" />
                        </div>

                        {/* SCREEN SELECTOR */}
                        <div>
                            <label style={labelStyle}>Select Screen Profile</label>
                            <select
                                value={selectedScreen}
                                onChange={(e) => setSelectedScreen(e.target.value)}
                                style={inputStyle}
                                size={10}
                            >
                                {screens.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.diagonal_inch}" {s.type} ({s.cutout_type})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* SUBMIT */}
                        <div style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
                            <button
                                onClick={handleMap}
                                disabled={!selectedPhone || !selectedScreen || submitting}
                                style={{
                                    width: '100%',
                                    background: '#6366f1',
                                    color: 'white',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    fontWeight: '600',
                                    cursor: (!selectedPhone || !selectedScreen || submitting) ? 'not-allowed' : 'pointer',
                                    opacity: (!selectedPhone || !selectedScreen || submitting) ? 0.7 : 1
                                }}
                            >
                                {submitting ? 'Linking...' : 'Link Selected Phone to Screen'}
                            </button>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}

const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: '500', color: '#334155' };
const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.9rem',
    outline: 'none',
    background: '#f8fafc'
};
