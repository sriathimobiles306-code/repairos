
import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom'; // Commented until deps verified
import '../index.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fake navigate for now if router not ready
    const navigate = (path: string) => window.location.href = path;

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) throw new Error('Invalid credentials');

            const data = await res.json();
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect
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
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Login to RepairOS</h2>

                {error && <div className="error-banner">{error}</div>}

                <form onSubmit={handleLogin} className="search-form">
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
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
                    New Shop? <a href="/register" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Create Account</a>
                </p>
            </div>
        </div>
    );
}
