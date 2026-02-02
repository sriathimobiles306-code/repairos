// client/src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import PhonesAdmin from './pages/admin/Phones';
import ScreensAdmin from './pages/admin/Screens';
import ModelMapper from './pages/admin/ModelMapper';
import ImportPage from './pages/admin/ImportPage';
import InventoryPage from './pages/admin/Inventory';
import BillingPage from './pages/admin/BillingPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import PartsSearch from './pages/PartsSearch';
import UserUpgradePage from './pages/UserUpgradePage';
import PartsAdmin from './pages/admin/PartsAdmin';
import RulesAdmin from './pages/admin/Rules';
import './index.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('adminToken');
  // Strict: If no token, or if we want to be fancy, decode and check role.
  // For now, redirect to ADMIN login if missing.
  if (!token) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

// User-facing Layout with Top Header
function MainLayout() {
  const [usage, setUsage] = React.useState<{ tier: string; usage: number; limit: number } | null>(null);
  const token = localStorage.getItem('token');

  React.useEffect(() => {
    if (token) {
      fetch('/api/subscription/status', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setUsage(data))
        .catch(() => { });
    }
  }, [token]);

  return (
    <div className="app-container">
      <header className="app-header">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1>RepairOS <span className="beta-badge">BETA</span></h1>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {usage && (
            <div style={{
              fontSize: '0.8rem',
              padding: '4px 12px',
              borderRadius: '20px',
              background: usage.tier === 'PRO' ? '#fef9c3' : '#e2e8f0',
              color: usage.tier === 'PRO' ? '#854d0e' : '#475569',
              fontWeight: 'bold',
              border: '1px solid rgba(0,0,0,0.05)'
            }}>
              {usage.tier === 'PRO'
                ? '🔥 PRO MEMBER'
                : `Free Plan: ${usage.usage} / ${usage.limit} Searches`}
            </div>
          )}

          {token && (
            <button
              onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
              style={{ background: 'transparent', color: 'var(--primary)', padding: '4px', fontSize: '0.8rem', border: 'none', boxShadow: 'none', cursor: 'pointer' }}
            >
              Logout
            </button>
          )}
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC & USER ROUTES (Use MainLayout with Header) */}
        <Route element={<MainLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Admin Login is Public but separate */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="/parts"
            element={
              <ProtectedRoute>
                <PartsSearch />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <UserUpgradePage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* ADMIN ROUTES (Use AdminLayout with Sidebar, NO MainLayout Header) */}
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="phones" element={<PhonesAdmin />} />
          <Route path="screens" element={<ScreensAdmin />} />
          <Route path="screens" element={<ScreensAdmin />} />
          <Route path="map" element={<ModelMapper />} />
          <Route path="screens" element={<ScreensAdmin />} />
          <Route path="map" element={<ModelMapper />} />
          <Route path="import" element={<ImportPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="parts" element={<PartsAdmin />} />
          <Route path="rules" element={<RulesAdmin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
