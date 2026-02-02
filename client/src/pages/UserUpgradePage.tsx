
import React, { useState } from 'react';
import { CheckCircle, XCircle, Zap, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UserUpgradePage() {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleUpgrade = async () => {
        if (!confirm('Simulate Payment of $29/mo?')) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/subscription/upgrade', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                alert('Upgrade Successful! Welcome to Pro.');
                window.location.href = '/'; // Refresh to update usage badge
            } else {
                alert('Upgrade Failed. Please try again.');
            }
        } catch (e) {
            alert('Error processing upgrade.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '900px', margin: '40px auto', textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '10px' }}>Upgrade to RepairOS <span style={{ color: '#eab308' }}>PRO</span></h1>
            <p style={{ color: '#64748b', fontSize: '1.2rem', marginBottom: '50px' }}>Unlock unlimited power for your repair business.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'center' }}>

                {/* FREE PLAN */}
                <div style={{ background: 'white', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', opacity: 0.8 }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Basic</h2>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '20px' }}>Free</div>
                    <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <li style={{ display: 'flex', gap: '10px' }}><CheckCircle size={20} color="#16a34a" /> 50 Searches per month</li>
                        <li style={{ display: 'flex', gap: '10px' }}><CheckCircle size={20} color="#16a34a" /> Glass Compatibility</li>
                        <li style={{ display: 'flex', gap: '10px' }}><XCircle size={20} color="#94a3b8" /> Display Cross-Reference</li>
                        <li style={{ display: 'flex', gap: '10px' }}><XCircle size={20} color="#94a3b8" /> IC Part Finder</li>
                        <li style={{ display: 'flex', gap: '10px' }}><XCircle size={20} color="#94a3b8" /> Reverse Model Lookup</li>
                    </ul>
                    <button disabled style={{ marginTop: '30px', width: '100%', padding: '16px', background: '#f1f5f9', border: 'none', borderRadius: '12px', fontWeight: 'bold', color: '#94a3b8' }}>
                        Current Plan
                    </button>
                </div>

                {/* PRO PLAN */}
                <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', padding: '50px', borderRadius: '24px', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.3)', position: 'relative' }}>

                    <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', background: '#eab308', color: 'black', fontWeight: 'bold', padding: '6px 16px', borderRadius: '20px', fontSize: '0.9rem' }}>
                        RECOMMENDED
                    </div>

                    <h2 style={{ fontSize: '1.5rem', marginBottom: '10px', color: '#fef3c7' }}>PRO</h2>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '20px' }}>$29<span style={{ fontSize: '1rem', color: '#94a3b8' }}>/mo</span></div>
                    <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <li style={{ display: 'flex', gap: '10px' }}><Zap size={20} color="#fbbf24" /> <strong>Unlimited Searches</strong></li>
                        <li style={{ display: 'flex', gap: '10px' }}><ShieldCheck size={20} color="#fbbf24" /> Advanced Display Fit</li>
                        <li style={{ display: 'flex', gap: '10px' }}><CheckCircle size={20} color="#fbbf24" /> IC Part Finder Access</li>
                        <li style={{ display: 'flex', gap: '10px' }}><CheckCircle size={20} color="#fbbf24" /> Reverse Model Lookup</li>
                        <li style={{ display: 'flex', gap: '10px' }}><CheckCircle size={20} color="#fbbf24" /> Priority Support</li>
                    </ul>
                    <button
                        onClick={handleUpgrade}
                        disabled={loading}
                        style={{ marginTop: '30px', width: '100%', padding: '16px', background: '#eab308', border: 'none', borderRadius: '12px', fontWeight: 'bold', color: 'black', fontSize: '1.1rem', cursor: 'pointer', transition: 'transform 0.1s' }}
                    >
                        {loading ? 'Processing...' : 'Upgrade Now'}
                    </button>
                </div>

            </div>
        </div>
    );
}
