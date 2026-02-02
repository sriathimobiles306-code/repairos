
import React, { useState, useEffect } from 'react';

interface Part {
    id: number;
    part_code: string;
    description: string;
    category: string;
}

interface Compatibility {
    brand: string;
    model: string;
    notes: string;
}

export default function PartsAdmin() {
    const [parts, setParts] = useState<Part[]>([]);
    const [search, setSearch] = useState('');
    const [selectedPart, setSelectedPart] = useState<Part | null>(null);
    const [compatList, setCompatList] = useState<Compatibility[]>([]);

    // New Part Form
    const [newCode, setNewCode] = useState('');
    const [newDesc, setNewDesc] = useState('');

    // Link Model Form
    const [linkBrand, setLinkBrand] = useState('');
    const [linkModel, setLinkModel] = useState('');

    const fetchParts = async (q: string) => {
        if (!q) return;
        const res = await fetch(`/api/parts/search?q=${q}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        });
        const data = await res.json();
        setParts(data);
    };

    const fetchCompatibility = async (id: number) => {
        const res = await fetch(`/api/parts/${id}/compatibility`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        });
        setCompatList(await res.json());
    };

    const handleCreatePart = async () => {
        await fetch('/api/parts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ code: newCode, desc: newDesc, category: 'IC' })
        });
        setNewCode(''); setNewDesc('');
        fetchParts(search);
    };

    const handleLinkModel = async () => {
        if (!selectedPart) return;
        await fetch(`/api/parts/${selectedPart.id}/link`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ brand: linkBrand, model: linkModel })
        });
        setLinkBrand(''); setLinkModel('');
        fetchCompatibility(selectedPart.id);
    };

    return (
        <div style={{ padding: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Part Finder Database</h1>

            {/* Search */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input
                    placeholder="Search Part (e.g. PM8953)"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ padding: '10px', flex: 1, borderRadius: '8px', border: '1px solid #ccc' }}
                />
                <button onClick={() => fetchParts(search)} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', borderRadius: '8px', border: 'none' }}>
                    Search
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Left: Part List */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontWeight: 'bold', marginBottom: '10px' }}>Parts List</h2>
                    {parts.map(p => (
                        <div
                            key={p.id}
                            onClick={() => { setSelectedPart(p); fetchCompatibility(p.id); }}
                            style={{
                                padding: '10px',
                                border: '1px solid #eee',
                                marginBottom: '5px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                background: selectedPart?.id === p.id ? '#eff6ff' : 'white'
                            }}
                        >
                            <div style={{ fontWeight: 'bold' }}>{p.part_code}</div>
                            <div style={{ fontSize: '0.85rem', color: '#666' }}>{p.description}</div>
                        </div>
                    ))}

                    {/* Add Part Form */}
                    <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '5px' }}>Add New Part</h3>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <input placeholder="Code (e.g. WCN3660)" value={newCode} onChange={e => setNewCode(e.target.value)} style={{ flex: 1, padding: '5px' }} />
                            <input placeholder="Description" value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ flex: 2, padding: '5px' }} />
                            <button onClick={handleCreatePart} style={{ background: '#10b981', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}>+</button>
                        </div>
                    </div>
                </div>

                {/* Right: Compatibility List */}
                {selectedPart && (
                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ fontWeight: 'bold', marginBottom: '10px' }}>Compatible Models for {selectedPart.part_code}</h2>

                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {compatList.length === 0 && <div style={{ color: '#888' }}>No linked models yet.</div>}
                            {compatList.map((c, i) => (
                                <div key={i} style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                                    <span style={{ fontWeight: 'bold' }}>{c.brand}</span> - {c.model}
                                    {c.notes && <span style={{ fontSize: '0.8rem', color: '#888', marginLeft: '10px' }}>({c.notes})</span>}
                                </div>
                            ))}
                        </div>

                        {/* Link Model Form */}
                        <div style={{ marginTop: '20px', background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '5px' }}>Link Model</h3>
                            <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
                                <input placeholder="Brand (e.g. Samsung)" value={linkBrand} onChange={e => setLinkBrand(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                                <input placeholder="Model (e.g. A03s)" value={linkModel} onChange={e => setLinkModel(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                                <button onClick={handleLinkModel} style={{ marginTop: '5px', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }}>
                                    Add Compatibility
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
