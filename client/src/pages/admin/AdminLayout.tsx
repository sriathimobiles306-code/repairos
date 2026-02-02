
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Smartphone, Monitor, Link as LinkIcon, UploadCloud, ShieldAlert, LogOut, Package, CreditCard } from 'lucide-react';

export default function AdminLayout() {
    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    return (
        <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            {/* SIDEBAR */}
            <aside style={{ width: '250px', background: 'white', borderRight: '1px solid #e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <div className="brand" style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(135deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        RepairOS <span style={{ fontSize: '0.8rem', color: '#64748b', WebkitTextFillColor: 'initial' }}>Admin</span>
                    </h2>
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <NavLink to="/admin" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={navStyle}>
                        <LayoutDashboard size={20} /> Dashboard
                    </NavLink>
                    <NavLink to="/admin/phones" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={navStyle}>
                        <Smartphone size={20} /> Phones
                    </NavLink>
                    <NavLink to="/admin/screens" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={navStyle}>
                        <Monitor size={20} /> Screens
                    </NavLink>
                    <NavLink to="/admin/map" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={navStyle}>
                        <LinkIcon size={20} /> Map Phone
                    </NavLink>
                    <NavLink to="/admin/import" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={navStyle}>
                        <UploadCloud size={20} /> Import Data
                    </NavLink>
                    <NavLink to="/admin/inventory" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={navStyle}>
                        <Package size={20} /> Inventory
                    </NavLink>
                    <NavLink to="/admin/billing" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={navStyle}>
                        <CreditCard size={20} /> Billing & POS
                    </NavLink>
                    <NavLink to="/admin/parts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={navStyle}>
                        <Smartphone size={20} /> Part Finder
                    </NavLink>
                    <NavLink to="/admin/rules" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={navStyle}>
                        <ShieldAlert size={20} /> Review Rules
                    </NavLink>
                </nav>

                <button onClick={handleLogout} style={{ ...navStyle, border: 'none', background: 'transparent', color: '#ef4444', marginTop: 'auto', cursor: 'pointer' }}>
                    <LogOut size={20} /> Logout
                </button>
            </aside>

            {/* CONTENT AREA */}
            <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
                <Outlet />
            </main>
        </div>
    );
}

const navStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    textDecoration: 'none',
    color: '#64748b',
    fontWeight: 500,
    transition: 'all 0.2s ease',
};
