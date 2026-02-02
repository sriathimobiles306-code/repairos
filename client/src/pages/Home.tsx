// client/src/pages/Home.tsx
import React, { useState } from 'react';
import { Search, ShieldCheck, AlertTriangle, Star, Smartphone, Database, Zap } from 'lucide-react';

interface MatchItem {
    type: 'EXACT' | 'UNIVERSAL';
    sku_code: string;
    name: string;
    status: 'GREEN' | 'YELLOW';
    confidence: number;
    warnings: string[];
    stock: number;
}

interface ApiResponse {
    screen_profile: {
        diagonal_inch: number;
        type: string;
    };
    matches: MatchItem[];
    subscription_gating: {
        allowed: boolean;
        hidden_universal_count: number;
        upgrade_message?: string;
    };
}

export default function Home() {
    const [mode, setMode] = useState<'GLASS' | 'DISPLAY'>('GLASS');

    // Glass Search State
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');

    // Display Search State
    const [sourceBrand, setSourceBrand] = useState('');
    const [sourceModel, setSourceModel] = useState('');
    const [targetBrand, setTargetBrand] = useState('');
    const [targetModel, setTargetModel] = useState('');

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<ApiResponse | null>(null);
    const [displayResult, setDisplayResult] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'GLASS') {
            searchGlass(brand, model);
        } else {
            checkDisplay(sourceBrand, sourceModel, targetBrand, targetModel);
        }
    };

    const searchGlass = async (qBrand: string, qModel: string) => {
        setBrand(qBrand);
        setModel(qModel);
        if (!qBrand || !qModel) return;

        setLoading(true);
        setError(null);
        setData(null);
        setDisplayResult(null);

        try {
            const token = localStorage.getItem('token');
            // Allow public access for demo if token missing, else redirect?
            // For now, let's just try public or auth
            const headers: any = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`/api/compatibility?brand=${encodeURIComponent(qBrand)}&model=${encodeURIComponent(qModel)}`, { headers });

            if (!res.ok) {
                const errJson = await res.json();
                throw new Error(errJson.message || 'Search failed');
            }

            const jsonData = await res.json();
            setData(jsonData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const checkDisplay = async (sBrand: string, sModel: string, tBrand: string, tModel: string) => {
        if (!sBrand || !sModel || !tBrand || !tModel) return;

        setLoading(true);
        setError(null);
        setData(null);
        setDisplayResult(null);

        try {
            const token = localStorage.getItem('token');
            const headers: any = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`/api/compatibility/display?source_brand=${encodeURIComponent(sBrand)}&source_model=${encodeURIComponent(sModel)}&target_brand=${encodeURIComponent(tBrand)}&target_model=${encodeURIComponent(tModel)}`, { headers });

            if (!res.ok) {
                const errJson = await res.json();
                throw new Error(errJson.message || 'Check failed');
            }

            const jsonData = await res.json();
            setDisplayResult(jsonData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="home-page">
            {/* HERO SECTION */}
            <header className="hero-section" style={{ textAlign: 'center', marginBottom: '40px', paddingTop: '20px' }}>
                {/* ... (Existing Hero Code) ... */}
                <div style={{
                    display: 'inline-flex', padding: '4px', background: '#f1f5f9', borderRadius: '30px', marginBottom: '24px'
                }}>
                    <button
                        onClick={() => setMode('GLASS')}
                        style={{
                            padding: '8px 24px', borderRadius: '24px', fontWeight: '700', fontSize: '0.9rem', border: 'none', cursor: 'pointer',
                            background: mode === 'GLASS' ? 'white' : 'transparent',
                            color: mode === 'GLASS' ? '#4f46e5' : '#64748b',
                            boxShadow: mode === 'GLASS' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                        }}
                    >
                        Glass Match
                    </button>
                    <button
                        onClick={() => setMode('DISPLAY')}
                        style={{
                            padding: '8px 24px', borderRadius: '24px', fontWeight: '700', fontSize: '0.9rem', border: 'none', cursor: 'pointer',
                            background: mode === 'DISPLAY' ? 'white' : 'transparent',
                            color: mode === 'DISPLAY' ? '#4f46e5' : '#64748b',
                            boxShadow: mode === 'DISPLAY' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                        }}
                    >
                        Display Fit
                    </button>
                    <a href="/parts" style={{
                        textDecoration: 'none', padding: '8px 24px', fontWeight: '700', fontSize: '0.9rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                        <Zap size={14} fill="#eab308" color="#eab308" /> Part Finder <span style={{ fontSize: '0.7rem', background: '#fef9c3', color: '#a16207', padding: '2px 6px', borderRadius: '4px' }}>PRO</span>
                    </a>
                </div>

                <h1 style={{
                    fontSize: '2.5rem', fontWeight: '800', lineHeight: 1.2, marginBottom: '16px',
                    background: 'linear-gradient(135deg, #1e293b 0%, #4f46e5 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>
                    {mode === 'GLASS' ? 'Find the Perfect Glass' : 'Check Display Compatibility'}
                </h1>
                <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '400px', margin: '0 auto' }}>
                    {mode === 'GLASS' ? 'Instantly match tempered glass across 20,000+ models.' : 'Avoid waste. Check if that spare screen fits the new repair.'}
                </p>
            </header>

            {/* SEARCH BOX */}
            <div className="search-section" style={{ background: 'white', padding: '20px', borderRadius: '24px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)', marginBottom: '30px' }}>
                <form onSubmit={handleSearch} className="search-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {mode === 'GLASS' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <input
                                type="text" placeholder="Brand (e.g. Samsung)"
                                value={brand} onChange={(e) => setBrand(e.target.value)}
                                style={{ border: 'none', background: '#f8fafc', padding: '18px', borderRadius: '12px' }}
                            />
                            <input
                                type="text" placeholder="Model (e.g. Galaxy S24)"
                                value={model} onChange={(e) => setModel(e.target.value)}
                                style={{ border: 'none', background: '#f8fafc', padding: '18px', borderRadius: '12px' }}
                            />
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', fontWeight: '700', color: '#166534' }}>DONOR DEVICE (Available Part)</label>
                                <input
                                    type="text" placeholder="Brand" value={sourceBrand} onChange={(e) => setSourceBrand(e.target.value)}
                                    style={{ width: '100%', border: '1px solid #bbf7d0', background: 'white', padding: '12px', borderRadius: '8px', marginBottom: '8px' }}
                                />
                                <input
                                    type="text" placeholder="Model" value={sourceModel} onChange={(e) => setSourceModel(e.target.value)}
                                    style={{ width: '100%', border: '1px solid #bbf7d0', background: 'white', padding: '12px', borderRadius: '8px' }}
                                />
                            </div>
                            <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', fontWeight: '700', color: '#1e40af' }}>TARGET DEVICE (Needs Repair)</label>
                                <input
                                    type="text" placeholder="Brand" value={targetBrand} onChange={(e) => setTargetBrand(e.target.value)}
                                    style={{ width: '100%', border: '1px solid #bfdbfe', background: 'white', padding: '12px', borderRadius: '8px', marginBottom: '8px' }}
                                />
                                <input
                                    type="text" placeholder="Model" value={targetModel} onChange={(e) => setTargetModel(e.target.value)}
                                    style={{ width: '100%', border: '1px solid #bfdbfe', background: 'white', padding: '12px', borderRadius: '8px' }}
                                />
                            </div>
                        </div>
                    )}

                    <button type="submit" disabled={loading} style={{ width: '100%', borderRadius: '16px', padding: '16px', background: '#4f46e5', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                        {loading ? 'Checking...' : (mode === 'GLASS' ? 'Find Glass' : 'Check Compatibility')}
                    </button>
                </form>
            </div>

            {/* RESULTS SECTION */}
            {error && (
                <div className="error-banner" style={{ background: '#fef2f2', color: '#991b1b', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px', fontWeight: 'bold' }}>
                        <AlertTriangle size={20} /> {error}
                    </div>
                    {error.includes('Limit Reached') && (
                        <a href="/billing" style={{ display: 'inline-block', background: '#dc2626', color: 'white', padding: '10px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
                            Upgrade to Pro for Unlimited Access
                        </a>
                    )}
                </div>
            )}

            {/* GLASS RESULTS */}
            {data && mode === 'GLASS' && (
                <div className="results-section">
                    <div className="screen-info">
                        Screen: {data.screen_profile.diagonal_inch}" {data.screen_profile.type}
                    </div>

                    <div className="cards-grid">
                        {data.matches.map((match) => (
                            <div key={match.sku_code} className={`result-card ${match.status.toLowerCase()}`}>
                                <div className="card-header">
                                    <div className="badge">{match.type}</div>
                                    {match.status === 'GREEN' && <ShieldCheck className="icon-green" size={20} />}
                                    {match.status === 'YELLOW' && <AlertTriangle className="icon-yellow" size={20} />}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3>{match.name}</h3>
                                    <div style={{
                                        fontSize: '0.75rem', fontWeight: '700', padding: '4px 8px', borderRadius: '6px',
                                        background: match.stock > 0 ? '#dcfce7' : '#fee2e2',
                                        color: match.stock > 0 ? '#166534' : '#991b1b',
                                        display: 'flex', alignItems: 'center', gap: '4px'
                                    }}>
                                        {match.stock > 0 ? `In Stock: ${match.stock}` : 'Out of Stock'}
                                    </div>
                                </div>
                                <div className="confidence">Match Confidence: {(match.confidence * 100).toFixed(0)}%</div>
                                {match.warnings.length > 0 && (
                                    <ul className="warnings">
                                        {match.warnings.map((w, i) => <li key={i}>{w}</li>)}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* DISPLAY RESULTS */}
            {displayResult && mode === 'DISPLAY' && (
                <div style={{ marginTop: '30px' }}>
                    <div style={{
                        background: displayResult.result.status === 'INCOMPATIBLE' ? '#fee2e2' : '#dcfce7',
                        border: `2px solid ${displayResult.result.status === 'INCOMPATIBLE' ? '#ef4444' : '#22c55e'}`,
                        borderRadius: '24px', padding: '30px', textAlign: 'center'
                    }}>
                        <div style={{
                            background: 'white', width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 20px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 10px 20px -5px rgba(0,0,0,0.1)'
                        }}>
                            {displayResult.result.status === 'INCOMPATIBLE' ? <AlertTriangle size={32} color="#dc2626" /> : <ShieldCheck size={32} color="#16a34a" />}
                        </div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 10px', color: displayResult.result.status === 'INCOMPATIBLE' ? '#991b1b' : '#166534' }}>
                            {displayResult.result.status === 'INCOMPATIBLE' ? 'Not Compatible' : 'Compatible Match!'}
                        </h2>
                        <div style={{ fontSize: '1.1rem', color: '#475569', marginBottom: '20px' }}>
                            Confidence Score: <strong>{(displayResult.result.confidence * 100).toFixed(0)}%</strong>
                        </div>

                        {displayResult.result.rejection_reasons.length > 0 && (
                            <div style={{ background: 'white', padding: '16px', borderRadius: '12px', textAlign: 'left', marginBottom: '20px' }}>
                                <strong style={{ color: '#dc2626', display: 'block', marginBottom: '8px' }}>Why it doesn't fit:</strong>
                                <ul style={{ margin: 0, paddingLeft: '20px', color: '#4b5563' }}>
                                    {displayResult.result.rejection_reasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
                                </ul>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', textAlign: 'left' }}>
                            <div style={{ background: 'white', padding: '16px', borderRadius: '12px' }}>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700' }}>DONOR</div>
                                <div style={{ fontWeight: 'bold' }}>{displayResult.source.brand} {displayResult.source.model}</div>
                                <div style={{ fontSize: '0.85rem' }}>{displayResult.source.display_resolution || 'Unknown Res'}</div>
                                <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>{displayResult.source.connection_type || 'Unknown Conn'}</div>
                            </div>
                            <div style={{ background: 'white', padding: '16px', borderRadius: '12px' }}>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700' }}>TARGET</div>
                                <div style={{ fontWeight: 'bold' }}>{displayResult.target.brand} {displayResult.target.model}</div>
                                <div style={{ fontSize: '0.85rem' }}>{displayResult.target.display_resolution || 'Unknown Res'}</div>
                                <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>{displayResult.target.connection_type || 'Unknown Conn'}</div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            <footer style={{ textAlign: 'center', marginTop: '60px', paddingBottom: '20px', color: '#cbd5e1', fontSize: '0.8rem' }}>
                &copy; 2026 RepairOS. All rights reserved.
            </footer>
        </div>
    );
}
