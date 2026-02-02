
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Trash2, Printer, Search, CheckCircle } from 'lucide-react';
import { Package } from 'lucide-react'; // Using Package icon for SKU

interface SKU {
    sku_code: string;
    glass_marketing_name: string;
    stock_quantity: number;
    price?: number; // Not in DB yet? Use dummy or add to schema. Assuming 0 or generic price for now. 
}

// Mock price since we didn't add price to SKUs yet.
const MOCK_PRICE = 499;

interface CartItem {
    sku_code: string;
    name: string;
    quantity: number;
    price: number;
}

export default function BillingPage() {
    const [inventory, setInventory] = useState<SKU[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);

    // Customer Info
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    const [loading, setLoading] = useState(false);
    const [checkoutStatus, setCheckoutStatus] = useState<'IDLE' | 'SUCCESS'>('IDLE');
    const [lastOrderId, setLastOrderId] = useState<number | null>(null);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch('/api/admin/inventory', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setInventory(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const addToCart = (sku: SKU) => {
        if (sku.stock_quantity <= 0) return alert('Out of Stock!');

        setCart(prev => {
            const existing = prev.find(item => item.sku_code === sku.sku_code);
            if (existing) {
                if (existing.quantity >= sku.stock_quantity) {
                    alert('Max stock reached');
                    return prev;
                }
                return prev.map(item => item.sku_code === sku.sku_code ? { ...item, quantity: item.quantity + 1 } : item);
            } else {
                return [...prev, { sku_code: sku.sku_code, name: sku.glass_marketing_name, quantity: 1, price: MOCK_PRICE }];
            }
        });
    };

    const removeFromCart = (skuCode: string) => {
        setCart(prev => prev.filter(item => item.sku_code !== skuCode));
    };

    const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    customer_name: customerName,
                    customer_phone: customerPhone,
                    items: cart.map(i => ({ sku_code: i.sku_code, quantity: i.quantity, price: i.price }))
                })
            });

            if (!res.ok) throw new Error('Checkout Failed');

            const data = await res.json();
            setLastOrderId(data.order_id);
            setCheckoutStatus('SUCCESS');
            setCart([]);
            setCustomerName('');
            setCustomerPhone('');
            fetchInventory(); // Refresh stock

        } catch (e) {
            alert('Checkout failed!');
        } finally {
            setLoading(false);
        }
    };

    const filteredInventory = inventory.filter(i =>
        i.sku_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.glass_marketing_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (checkoutStatus === 'SUCCESS') {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <CheckCircle size={64} color="#16a34a" style={{ margin: '0 auto 20px' }} />
                <h1>Order #{lastOrderId} Successful!</h1>
                <p>Stock has been deducted.</p>
                <div style={{ gap: '10px', display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                    <button onClick={() => window.print()} className="btn-primary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Printer size={18} /> Print Receipt
                    </button>
                    <button onClick={() => setCheckoutStatus('IDLE')} className="btn-secondary" style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                        New Order
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', height: 'calc(100vh - 100px)' }}>

            {/* LEFT: CATALOG */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '16px', top: '16px', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search Products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem' }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', overflowY: 'auto' }}>
                    {filteredInventory.map(sku => (
                        <div key={sku.sku_code}
                            onClick={() => addToCart(sku)}
                            style={{
                                background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer',
                                transition: 'all 0.2s', opacity: sku.stock_quantity > 0 ? 1 : 0.6
                            }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '0.9rem' }}>{sku.glass_marketing_name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace', marginBottom: '10px' }}>{sku.sku_code}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#4f46e5' }}>₹{MOCK_PRICE}</div>
                                <div style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px', background: sku.stock_quantity > 0 ? '#dcfce7' : '#fee2e2', color: sku.stock_quantity > 0 ? '#166534' : '#991b1b' }}>
                                    {sku.stock_quantity} left
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT: CART */}
            <div style={{ background: 'white', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
                    <ShoppingCart size={24} /> Current Order
                </h2>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {cart.map(item => (
                        <div key={item.sku_code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                            <div>
                                <div style={{ fontWeight: '600' }}>{item.name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>₹{item.price} x {item.quantity}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ fontWeight: 'bold' }}>₹{item.price * item.quantity}</div>
                                <button onClick={() => removeFromCart(item.sku_code)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: '40px' }}>Cart is empty</div>}
                </div>

                <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '20px', marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px' }}>
                        <span>Total</span>
                        <span>₹{cartTotal}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                        <input
                            type="text" placeholder="Customer Name (Optional)"
                            value={customerName} onChange={e => setCustomerName(e.target.value)}
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        />
                        <input
                            type="text" placeholder="Phone (Optional)"
                            value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        />
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={loading || cart.length === 0}
                        style={{
                            width: '100%', padding: '18px', borderRadius: '16px', background: '#4f46e5', color: 'white',
                            border: 'none', fontSize: '1.1rem', fontWeight: 'bold', cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                            opacity: cart.length === 0 ? 0.5 : 1
                        }}
                    >
                        {loading ? 'Processing...' : `Pay ₹${cartTotal}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
