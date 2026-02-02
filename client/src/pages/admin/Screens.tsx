
import React, { useState } from 'react';
import { Monitor, Plus } from 'lucide-react';

export default function ScreensAdmin() {
    const [formData, setFormData] = useState({
        type: 'FLAT',
        diagonal: '',
        width: '',
        height: '',
        cornerRadius: '',
        cutoutType: 'PUNCH_HOLE_CENTER',
        cutoutWidth: '',
        cutoutHeight: '',
        cutoutX: '',
        cutoutY: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const token = localStorage.getItem('token');
            const payload = {
                ...formData,
                diagonal: parseFloat(formData.diagonal),
                width: parseFloat(formData.width),
                height: parseFloat(formData.height),
                cornerRadius: parseFloat(formData.cornerRadius) || 0,
                cutoutWidth: parseFloat(formData.cutoutWidth) || 0,
                cutoutHeight: parseFloat(formData.cutoutHeight) || 0,
                cutoutX: parseFloat(formData.cutoutX) || 0,
                cutoutY: parseFloat(formData.cutoutY) || 0
            };

            const res = await fetch('/api/admin/screens', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to add screen');
            }

            setMessage({ type: 'success', text: `Successfully added Screen Profile (ID: ${data.id})` });
            // Reset critical fields
            setFormData(prev => ({ ...prev, width: '', height: '', diagonal: '' }));

        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-page">
            <header style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Monitor /> Screen Management
                </h1>
                <p style={{ color: '#64748b' }}>Define physical dimensions and cutout specs.</p>
            </header>

            <div className="card" style={{ background: 'white', padding: '30px', borderRadius: '12px', maxWidth: '800px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Add Screen Profile</h2>

                {message && (
                    <div style={{
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
                        color: message.type === 'success' ? '#059669' : '#dc2626',
                        border: `1px solid ${message.type === 'success' ? '#10b981' : '#f87171'}`
                    }}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                    {/* PHYSICAL DIMENSIONS */}
                    <div className="section" style={{ gridColumn: '1 / -1' }}>
                        <h3 style={{ fontSize: '1rem', color: '#475569', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>Physical Dimensions</h3>
                    </div>

                    <div className="form-group">
                        <label style={labelStyle}>Screen Type</label>
                        <select name="type" value={formData.type} onChange={handleChange} style={inputStyle}>
                            <option value="FLAT">Flat (Standard)</option>
                            <option value="2.5D">2.5D (Slight Curve)</option>
                            <option value="3D_CURVED">3D Curved (Edge)</option>
                            <option value="FOLDABLE_INNER">Foldable (Inner)</option>
                            <option value="FOLDABLE_OUTER">Foldable (Outer)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label style={labelStyle}>Diagonal (inches)</label>
                        <input type="number" step="0.1" name="diagonal" value={formData.diagonal} onChange={handleChange} required style={inputStyle} placeholder="6.7" />
                    </div>

                    <div className="form-group">
                        <label style={labelStyle}>Width (mm)</label>
                        <input type="number" step="0.01" name="width" value={formData.width} onChange={handleChange} required style={inputStyle} placeholder="76.4" />
                    </div>

                    <div className="form-group">
                        <label style={labelStyle}>Height (mm)</label>
                        <input type="number" step="0.01" name="height" value={formData.height} onChange={handleChange} required style={inputStyle} placeholder="161.2" />
                    </div>

                    <div className="form-group">
                        <label style={labelStyle}>Corner Radius (mm)</label>
                        <input type="number" step="0.1" name="cornerRadius" value={formData.cornerRadius} onChange={handleChange} style={inputStyle} placeholder="4.0" />
                    </div>

                    {/* CUTOUT SPECS */}
                    <div className="section" style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                        <h3 style={{ fontSize: '1rem', color: '#475569', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>Notch / Cutout</h3>
                    </div>

                    <div className="form-group">
                        <label style={labelStyle}>Cutout Type</label>
                        <select name="cutoutType" value={formData.cutoutType} onChange={handleChange} style={inputStyle}>
                            <option value="NONE">None (Plain)</option>
                            <option value="PUNCH_HOLE_CENTER">Punch Hole (Center)</option>
                            <option value="PUNCH_HOLE_LEFT">Punch Hole (Left)</option>
                            <option value="NOTCH_TEARDROP">Teardrop Notch</option>
                            <option value="NOTCH_WIDE">Wide Notch (iPhone)</option>
                            <option value="DYNAMIC_ISLAND">Dynamic Island</option>
                        </select>
                    </div>

                    <div className="form-group"></div> {/* Spacer */}

                    <div className="form-group">
                        <label style={labelStyle}>Cutout Width (mm)</label>
                        <input type="number" step="0.1" name="cutoutWidth" value={formData.cutoutWidth} onChange={handleChange} style={inputStyle} />
                    </div>

                    <div className="form-group">
                        <label style={labelStyle}>Cutout Height (mm)</label>
                        <input type="number" step="0.1" name="cutoutHeight" value={formData.cutoutHeight} onChange={handleChange} style={inputStyle} />
                    </div>

                    <div className="form-group">
                        <label style={labelStyle}>Position X (mm)</label>
                        <input type="number" step="0.1" name="cutoutX" value={formData.cutoutX} onChange={handleChange} style={inputStyle} placeholder="From left" />
                    </div>

                    <div className="form-group">
                        <label style={labelStyle}>Position Y (mm)</label>
                        <input type="number" step="0.1" name="cutoutY" value={formData.cutoutY} onChange={handleChange} style={inputStyle} placeholder="From top" />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            gridColumn: '1 / -1',
                            background: '#10b981',
                            color: 'white',
                            padding: '12px',
                            borderRadius: '8px',
                            border: 'none',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '8px',
                            opacity: loading ? 0.7 : 1,
                            marginTop: '20px'
                        }}
                    >
                        {loading ? 'Saving...' : <><Plus size={18} /> Add Screen Profile</>}
                    </button>
                </form>
            </div>
        </div>
    );
}

const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: '500', color: '#334155', fontSize: '0.9rem' };
const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s',
};
