import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';
import {
  LayoutDashboard, Package, Bell, LogOut
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = [
    { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/suppliers', icon: <Package size={18} />, label: 'Suppliers' },
    { to: '/alerts', icon: <Bell size={18} />, label: 'Alerts' },
  ];

  return (
    <aside style={{
      width: '240px', minHeight: '100vh', background: '#0d1117',
      borderRight: '1px solid #1e3058', display: 'flex',
      flexDirection: 'column', padding: '0', position: 'fixed',
      top: 0, left: 0, bottom: 0, zIndex: 100
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid #1e3058' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', background: '#f59e0b',
            borderRadius: '8px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', boxShadow: '0 0 20px rgba(245,158,11,0.4)'
          }}>
            <BrandLogo size={36} />
          </div>
          <div>
            <div style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '16px', color: '#fff' }}>
              Auto Store Manager
            </div>
            <div style={{ fontSize: '10px', color: '#f59e0b', letterSpacing: '1px' }}>
              RISK MONITOR
            </div>
          </div>
        </div>
      </div>

      {/* User info */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e3058' }}>
        <div style={{ fontSize: '12px', color: '#64748b' }}>Logged in as</div>
        <div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '600', marginTop: '2px' }}>
          {user?.name || 'User'}
        </div>
        <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '2px' }}>
          {user?.business_name || ''}
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {links.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 20px', textDecoration: 'none',
            fontSize: '13px', transition: 'all 0.2s',
            color: isActive ? '#f59e0b' : '#94a3b8',
            background: isActive ? 'rgba(245,158,11,0.08)' : 'transparent',
            borderLeft: isActive ? '2px solid #f59e0b' : '2px solid transparent',
          })}>
            {icon}{label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #1e3058' }}>
        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'none', border: 'none', color: '#64748b',
          cursor: 'pointer', fontSize: '13px', padding: '8px 0',
          transition: 'color 0.2s', width: '100%'
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
          onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}