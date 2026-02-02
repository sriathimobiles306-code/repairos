
import React, { useState, useEffect } from 'react';
import { Package, Smartphone, Save, Search, AlertCircle } from 'lucide-react';

export default function InventoryPage() {
    const [skus, setSkus] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const adminToken = localStorage.getItem('adminToken');
            const res = await fetch('/api/admin/inventory', {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            if (res.ok) {
                setSkus(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleStockUpdate = async (sku: string, newQty: string) => {
        const qty = parseInt(newQty);
        if (isNaN(qty)) return;

        setSaving(sku);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/inventory/stock', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ sku, qty })
            });
            if (res.ok) {
                setSkus(prev => prev.map(s => s.sku_code === sku ? { ...s, stock_quantity: qty } : s));
            }
        } finally {
            setSaving(null);
        }
    };

    const filtered = skus.filter(s =>
        s.marketing_name?.toLowerCase().includes(filter.toLowerCase()) ||
        s.sku_code.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="admin-page">
            <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Package /> Inventory
                    </h1>
                    <p style={{ color: '#64748b' }}>Manage stock levels for tempered glass.</p>
                </div>
                <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} size={18} />
                    <input
                        type="text"
                        placeholder="Search SKU..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        style={{ padding: '10px 10px 10px 40px', borderRadius: '12px', border: '1px solid #cbd5e1', width: '250px' }}
                    />
                </div>
            </header>

            <div className="card" style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>SKU CODE</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>PRODUCT NAME</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>DIMENSIONS</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>STOCK</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(sku => (
                            <tr key={sku.sku_code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '16px', fontFamily: 'monospace', fontWeight: 600 }}>{sku.sku_code}</td>
                                <td style={{ padding: '16px' }}>{sku.marketing_name || 'Generic Glass'}</td>
                                <td style={{ padding: '16px', color: '#64748b', fontSize: '0.9rem' }}>{sku.glass_width_mm} x {sku.glass_height_mm}mm</td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input
                                            type="number"
                                            defaultValue={sku.stock_quantity}
                                            onBlur={(e) => handleStockUpdate(sku.sku_code, e.target.value)}
                                            style={{
                                                width: '80px', padding: '8px', borderRadius: '8px',
                                                border: '1px solid #cbd5e1', fontWeight: 700,
                                                color: sku.stock_quantity > 0 ? '#166534' : '#991b1b',
                                                background: sku.stock_quantity > 0 ? '#f0fdf4' : '#fef2f2'
                                            }}
                                        />
                                        {saving === sku.sku_code && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Saving...</span>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && !loading && (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                        No products found.
                    </div>
                )}
            </div>
        </div>
    );
}
