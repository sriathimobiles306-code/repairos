import React, { useState } from 'react';
import { Smartphone, Plus } from 'lucide-react';

export default function PhonesAdmin() {
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [aliases, setAliases] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const token = localStorage.getItem('token');
            const aliasArray = aliases.split(',').map(a => a.trim()).filter(a => a.length > 0);

            const res = await fetch('/api/admin/phones', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    brand,
                    model,
                    aliases: aliasArray
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to add phone');
            }

            setMessage({ type: 'success', text: `Successfully added ${brand} ${model}` });
            setBrand('');
            setModel('');
            setAliases('');

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
                    <Smartphone /> Phone Management
                </h1>
                <p style={{ color: '#64748b' }}>Add new mobile models to the database.</p>
            </header>

            <div className="card" style={{ background: 'white', padding: '30px', borderRadius: '12px', maxWidth: '600px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Add New Phone</h2>

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

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#334155' }}>Brand</label>
                        <input
                            type="text"
                            placeholder="e.g. Samsung"
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                            required
                            style={inputStyle}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#334155' }}>Model Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Galaxy S25 Ultra"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            required
                            style={inputStyle}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#334155' }}>
                            Aliases <span style={{ fontWeight: 'normal', color: '#94a3b8' }}>(comma separated)</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. SM-S928B, Galaxy S25U"
                            value={aliases}
                            onChange={(e) => setAliases(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: '#6366f1',
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
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Saving...' : <><Plus size={18} /> Add Phone</>}
                    </button>
                </form>
            </div>
        </div>
    );
}

const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s',
};
