
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Part {
    id: number;
    part_code: string;
    description: string;
    // For Reverse Lookup, the part comes with notes from the compatibility table if joined
    notes?: string;
}

interface Compatibility {
    brand: string;
    model: string;
    notes: string;
}

export default function PartsSearch() {
    const [mode, setMode] = useState<'PART' | 'MODEL'>('PART');
    const [search, setSearch] = useState('');
    const [parts, setParts] = useState<Part[]>([]);
    const [selectedPart, setSelectedPart] = useState<Part | null>(null);
    const [compatList, setCompatList] = useState<Compatibility[]>([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const fetchParts = async (q: string) => {
        if (!q) return;
        setError('');
        try {
            const endpoint = mode === 'PART'
                ? `/api/parts/search?q=${q}`
                : `/api/parts/search/model?q=${q}`;

            const res = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();

            if (res.status === 403) {
                setError('Feature Locked: PRO Plan Required.');
                return;
            }

            if (!res.ok) throw new Error();
            setParts(data);
            setSelectedPart(null); // Reset selection
        } catch (err) {
            setError('Search failed.');
        }
    };

    const fetchCompatibility = async (id: number) => {
        const res = await fetch(`/api/parts/${id}/compatibility`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
            setCompatList(await res.json());
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '20px' }}>
            <button
                onClick={() => navigate('/')}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px',
                    background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 'bold'
                }}
            >
                ← Back to Dashboard
            </button>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>IC Part Finder</h1>
                <p style={{ color: '#666' }}>Find compatible donors for any IC or component.</p>
                {/* PRO BADGE */}
                <div style={{ display: 'inline-block', background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: 'black', fontWeight: 'bold', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', marginTop: '10px' }}>
                    PRO FEATURE
                </div>
            </div>

            {/* ERROR / PRO LOCK */}
            {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', padding: '20px', borderRadius: '12px', textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{error}</div>
                    <button onClick={() => navigate('/billing')} style={{ marginTop: '10px', background: '#dc2626', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}>
                        Upgrade Now
                    </button>
                </div>
            )}

            {/* MODE TOGGLE */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
                <button
                    onClick={() => setMode('PART')}
                    style={{ padding: '8px 24px', borderRadius: '20px', border: '1px solid #3b82f6', background: mode === 'PART' ? '#3b82f6' : 'white', color: mode === 'PART' ? 'white' : '#3b82f6', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    Search by Part Number
                </button>
                <button
                    onClick={() => setMode('MODEL')}
                    style={{ padding: '8px 24px', borderRadius: '20px', border: '1px solid #3b82f6', background: mode === 'MODEL' ? '#3b82f6' : 'white', color: mode === 'MODEL' ? 'white' : '#3b82f6', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    Search by Phone Model
                </button>
            </div>

            {/* Search Bar */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '40px' }}>
                <input
                    placeholder={mode === 'PART' ? "Enter Part Number (e.g. PM8953, WCN3660...)" : "Enter Phone Model (e.g. Redmi Note 4, A03s...)"}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && fetchParts(search)}
                    style={{ flex: 1, padding: '16px', fontSize: '1.1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <button
                    onClick={() => fetchParts(search)}
                    style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0 30px', fontSize: '1.1rem', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    Search
                </button>
            </div>

            {/* Results */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: '40px' }}>

                {/* Part List */}
                <div>
                    {parts.length > 0 && <h3 style={{ marginBottom: '15px', fontWeight: 'bold' }}>{mode === 'PART' ? 'Components Found' : 'Components in ' + search}</h3>}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {parts.map(p => (
                            <div
                                key={p.id}
                                onClick={() => { setSelectedPart(p); fetchCompatibility(p.id); }}
                                style={{
                                    padding: '16px',
                                    background: selectedPart?.id === p.id ? '#eff6ff' : 'white',
                                    border: selectedPart?.id === p.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{p.part_code}</div>
                                <div style={{ color: '#64748b' }}>{p.description}</div>
                                {mode === 'MODEL' && p.notes && <div style={{ fontSize: '0.85rem', color: '#f59e0b', marginTop: '4px' }}>{p.notes}</div>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Compatibility View */}
                <div>
                    {selectedPart ? (
                        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <div style={{ padding: '20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{selectedPart.part_code}</h2>
                                <p style={{ color: '#64748b' }}>Compatible Models (Donors)</p>
                            </div>

                            <div style={{ padding: '20px' }}>
                                {compatList.length === 0 ? (
                                    <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>No known models yet.</div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                                        {compatList.map((c, i) => (
                                            <div key={i} style={{ padding: '12px', border: '1px solid #eee', borderRadius: '8px', background: '#fff' }}>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>{c.brand}</div>
                                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{c.model}</div>
                                                {c.notes && <div style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: '4px' }}>{c.notes}</div>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ fontSize: '3rem' }}>🔍</div>
                            <div>Select a component to view donors</div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
