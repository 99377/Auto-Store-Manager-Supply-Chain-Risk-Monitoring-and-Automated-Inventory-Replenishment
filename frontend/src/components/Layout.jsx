import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';
import {
  LayoutDashboard, Package, Bell, LogOut,
  Menu, X, HelpCircle, Info, ChevronRight, Store, ShoppingCart,
} from 'lucide-react';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',  tag: 'Overview' },
  { to: '/inventory', icon: Store,           label: 'My Shop',    tag: 'Inventory' },
  { to: '/suppliers', icon: Package,         label: 'Suppliers',  tag: 'Registry' },
  { to: '/order-supplies', icon: ShoppingCart, label: 'Order Supplies', tag: 'Auto Order' },
  { to: '/alerts',    icon: Bell,            label: 'Alerts',     tag: 'Notifications' },
  { to: '/about',     icon: Info,            label: 'About',      tag: 'Project' },
  { to: '/help',      icon: HelpCircle,      label: 'Help',       tag: 'Docs' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile]       = useState(false);
  const [time, setTime]               = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => { if (isMobile) setSidebarOpen(false); }, [location, isMobile]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const currentPage  = NAV.find(n => location.pathname.startsWith(n.to))?.label || 'Dashboard';

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: 'var(--bg)', fontFamily: 'var(--font-body)',
    }}>

      {/* ── Ambient background ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 40% 60% at 0% 30%, var(--ambient-1) 0%, transparent 60%),
          radial-gradient(ellipse 30% 40% at 100% 70%, var(--ambient-2) 0%, transparent 60%)
        `,
      }} />

      {/* ── Dot grid ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, var(--dot-grid) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      {/* ── Mobile overlay ── */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0,
          background: 'var(--mobile-overlay-bg)',
          backdropFilter: 'blur(6px)',
          zIndex: 99,
        }} />
      )}

      {/* ────────────────── SIDEBAR ────────────────── */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: 'var(--sidebar-w)',
        transform: sidebarOpen ? 'translateX(0)' : `translateX(calc(-1 * var(--sidebar-w)))`,
        transition: 'transform 0.35s cubic-bezier(0.22,1,0.36,1)',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border)',
        backdropFilter: 'blur(32px)',
        zIndex: 100,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Sidebar ambient glow */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40%',
          background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(240,180,41,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* ── Logo ── */}
        <div style={{
          padding: '20px 18px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BrandLogo size={38} />
            <div>
              <div style={{
                fontFamily: 'var(--font-head)', fontWeight: 800,
                fontSize: '16px', color: 'var(--white)', letterSpacing: '-0.2px',
              }}>Auto Store Manager</div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '8.5px',
                color: 'var(--gold)', letterSpacing: '2px', marginTop: '1px',
              }}>SMART RETAIL OPERATIONS</div>
            </div>
          </div>

          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} style={{
              background: 'none', border: 'none',
              color: 'var(--text2)', cursor: 'pointer', padding: '4px',
            }}>
              <X size={17} />
            </button>
          )}
        </div>

        {/* ── Live clock ── */}
        <div style={{
          padding: '12px 18px',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(240,180,41,0.02)',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px',
            color: 'var(--text3)', letterSpacing: '1.5px', marginBottom: '3px',
          }}>SYSTEM CLOCK</div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '18px',
            color: 'var(--gold2)', fontWeight: 500, letterSpacing: '1px',
          }}>
            {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px',
            color: 'var(--text3)', marginTop: '2px',
          }}>
            {time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>

        {/* ── User chip ── */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--gold), #92400e)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-head)', fontWeight: 800,
              fontSize: '14px', color: '#000', flexShrink: 0,
              boxShadow: '0 0 12px rgba(240,180,41,0.3)',
            }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                fontSize: '13px', fontWeight: 600,
                color: 'var(--white)', whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{user?.name}</div>
              <div style={{
                fontSize: '11px', color: 'var(--text3)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{user?.business_name || user?.email}</div>
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '9px',
            color: 'var(--text3)', letterSpacing: '2px',
            padding: '8px 10px 6px', textTransform: 'uppercase',
          }}>Navigation</div>

          {NAV.map(({ to, icon: Icon, label, tag }) => (
            <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
              {({ isActive }) => (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '11px',
                  padding: '10px 12px', borderRadius: '12px',
                  margin: '2px 0', cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: isActive ? 'rgba(240,180,41,0.08)' : 'transparent',
                  border: isActive ? '1px solid rgba(240,180,41,0.15)' : '1px solid transparent',
                  color: isActive ? 'var(--gold)' : 'var(--text2)',
                  position: 'relative',
                }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.color = 'var(--text)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text2)';
                    }
                  }}
                >
                  {isActive && (
                    <div style={{
                      position: 'absolute', left: 0, top: '20%', bottom: '20%',
                      width: '2.5px', borderRadius: '0 2px 2px 0',
                      background: 'var(--gold)',
                      boxShadow: '0 0 8px rgba(240,180,41,0.6)',
                      marginLeft: '-1px',
                    }} />
                  )}
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: isActive ? 600 : 400, lineHeight: 1.2 }}>{label}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '1px' }}>{tag}</div>
                  </div>
                  {isActive && (
                    <ChevronRight size={12} style={{ opacity: 0.5, flexShrink: 0 }} />
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── Sign out ── */}
        <div style={{ padding: '10px 10px 16px', borderTop: '1px solid var(--border)' }}>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', padding: '10px 12px', borderRadius: '12px',
            background: 'none', border: '1px solid transparent',
            color: 'var(--text3)', cursor: 'pointer', fontSize: '13px',
            fontFamily: 'var(--font-body)', transition: 'all 0.2s',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(244,63,94,0.07)';
              e.currentTarget.style.color = '#f87171';
              e.currentTarget.style.borderColor = 'rgba(244,63,94,0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = 'var(--text3)';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <LogOut size={15} />
            <span>Sign out</span>
          </button>

          <div style={{
            textAlign: 'center', marginTop: '12px',
            fontFamily: 'var(--font-mono)', fontSize: '9px',
            color: 'var(--text3)', letterSpacing: '0.5px',
          }}>Auto Store Manager v1.0 · 2025–26</div>
        </div>
      </aside>

      {/* ────────────────── TOPBAR ────────────────── */}
      <div style={{
        position: 'fixed', top: 0, zIndex: 98,
        left: sidebarOpen && !isMobile ? 'var(--sidebar-w)' : '0',
        right: 0, height: 'var(--topbar-h)',
        background: 'var(--topbar-bg)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(24px)',
        display: 'flex', alignItems: 'center',
        padding: '0 22px', gap: '12px',
        transition: 'left 0.35s cubic-bezier(0.22,1,0.36,1)',
      }}>
        {/* Hamburger */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border2)',
          borderRadius: '9px', padding: '7px',
          cursor: 'pointer', color: 'var(--text2)',
          display: 'flex', alignItems: 'center',
          transition: 'all 0.2s', flexShrink: 0,
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(240,180,41,0.08)'; e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.borderColor = 'rgba(240,180,41,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.borderColor = 'var(--border2)'; }}
        >
          <Menu size={16} />
        </button>

        {/* Breadcrumb */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text3)',
        }}>
          <span>Auto Store Manager</span>
          <ChevronRight size={11} />
          <span style={{ color: 'var(--gold2)', fontWeight: 500 }}>{currentPage}</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Pipeline status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '5px 12px', borderRadius: '20px',
          background: 'rgba(16,185,129,0.06)',
          border: '1px solid rgba(16,185,129,0.15)',
          fontSize: '10.5px', color: '#34d399',
          fontFamily: 'var(--font-mono)', letterSpacing: '0.5px',
        }}>
          <div style={{
            width: '5px', height: '5px', borderRadius: '50%',
            background: '#34d399',
            animation: 'blink 2.5s ease-in-out infinite',
          }} />
          LIVE
        </div>

        {/* Version */}
        <div style={{
          padding: '4px 10px', borderRadius: '7px',
          fontFamily: 'var(--font-mono)', fontSize: '10px',
          color: 'var(--gold)', fontWeight: 600,
          background: 'rgba(240,180,41,0.07)',
          border: '1px solid rgba(240,180,41,0.15)',
        }}>v1.0</div>
      </div>

      {/* ────────────────── MAIN CONTENT ────────────────── */}
      <main style={{
        marginLeft: sidebarOpen && !isMobile ? 'var(--sidebar-w)' : '0',
        marginTop: 'var(--topbar-h)',
        flex: 1,
        minHeight: 'calc(100vh - var(--topbar-h))',
        transition: 'margin-left 0.35s cubic-bezier(0.22,1,0.36,1)',
        position: 'relative', zIndex: 1,
        padding: '30px 28px',
      }}>
        {children}
      </main>
    </div>
  );
}