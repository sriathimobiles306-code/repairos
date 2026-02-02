
import React, { useState } from 'react';
import '../index.css';

export default function Register() {
    const [businessName, setBusinessName] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessName, fullName, email, password }),
            });

            if (!res.ok) throw new Error('Registration failed');

            const data = await res.json();
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));

            window.location.href = '/';
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ maxWidth: '400px', margin: '4rem auto' }}>
            <div className="result-card">
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Create Account</h2>

                {error && <div className="error-banner">{error}</div>}

                <form onSubmit={handleRegister} className="search-form">
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="Shop Name (e.g. Guru Mobiles)"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="Owner Name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Create Account' : 'Register'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
                    Already have an account? <a href="/login" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Login</a>
                </p>
            </div>
        </div>
    );
}
