import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import SupplierCard from '../components/SupplierCard';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  RefreshCw, AlertTriangle, Package, Bell,
  TrendingUp, Zap, ArrowRight, Clock,
} from 'lucide-react';

export default function Dashboard() {
  const { user }            = useAuth();
  const [risks, setRisks]   = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [countdown, setCountdown]   = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [r, a] = await Promise.all([
        API.get('/api/risks'),
        API.get('/api/alerts'),
      ]);
      setRisks(r.data);
      setAlerts(a.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const triggerPipeline = async () => {
    setTriggering(true);
    setCountdown(65);
    try {
      await API.post('/api/pipeline/trigger');
      const timer = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) { clearInterval(timer); fetchData(); setTriggering(false); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch (err) { console.error(err); setTriggering(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const high   = risks.filter(r => r.risk_level === 'high').length;
  const med    = risks.filter(r => r.risk_level === 'medium').length;
  const unread = alerts.filter(a => !a.is_read).length;

  const stats = [
    { label: 'Suppliers',   value: risks.length, sub: 'Under monitoring', icon: Package,       color: '#0ea5e9', dimColor: 'rgba(14,165,233,0.1)'  },
    { label: 'High Risk',   value: high,          sub: 'Immediate action',  icon: AlertTriangle, color: '#f43f5e', dimColor: 'rgba(244,63,94,0.1)'   },
    { label: 'Medium Risk', value: med,           sub: 'Monitor closely',   icon: TrendingUp,    color: 'var(--gold)', dimColor: 'rgba(240,180,41,0.1)' },
    { label: 'Alerts',      value: unread,        sub: 'Unread',            icon: Bell,          color: '#a78bfa', dimColor: 'rgba(167,139,250,0.1)' },
  ];

  return (
    <Layout>
      <div className="animate-fadeUp">

        {/* ── Page header ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: '32px',
          flexWrap: 'wrap', gap: '16px',
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '10px',
              color: 'var(--gold)', letterSpacing: '2.5px', marginBottom: '7px',
            }}>COMMAND CENTER</div>
            <h1 style={{
              fontFamily: 'var(--font-head)', fontSize: 'clamp(22px,3vw,32px)',
              fontWeight: 800, color: 'var(--white)',
              letterSpacing: '-0.5px', marginBottom: '6px',
            }}>Risk Dashboard</h1>
            <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.5 }}>
              Welcome back,{' '}
              <span style={{ color: 'var(--gold2)', fontWeight: 600 }}>{user?.name}</span>
              {user?.business_name ? (
                <span style={{ color: 'var(--text3)' }}> · {user.business_name}</span>
              ) : null}
            </p>
          </div>

          <button
            onClick={triggerPipeline}
            disabled={triggering}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '11px 20px',
              background: triggering
                ? 'rgba(255,255,255,0.03)'
                : 'linear-gradient(135deg, rgba(240,180,41,0.15), rgba(240,180,41,0.08))',
              border: `1px solid ${triggering ? 'var(--border)' : 'rgba(240,180,41,0.3)'}`,
              borderRadius: 'var(--radius-sm)',
              color: triggering ? 'var(--text3)' : 'var(--gold)',
              fontSize: '13px', fontWeight: 600,
              cursor: triggering ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-body)',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            <RefreshCw size={14} className={triggering ? 'spin' : ''} />
            {triggering ? `Processing… ${countdown}s` : 'Run Pipeline'}
          </button>
        </div>

        {/* ── Stats ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))',
          gap: '14px', marginBottom: '32px',
        }}>
          {stats.map(({ label, value, sub, icon: Icon, color, dimColor }, i) => (
            <div key={label} className={`animate-fadeUp d${i + 1}`} style={{
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '20px',
              position: 'relative', overflow: 'hidden',
              transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = `${color}33`;
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `0 16px 40px rgba(0,0,0,0.5)`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Top accent */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                background: `linear-gradient(90deg, ${color}, transparent)`,
              }} />

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '11px',
                  background: dimColor,
                  border: `1px solid ${color}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color,
                }}>
                  <Icon size={18} strokeWidth={2} />
                </div>
              </div>

              <div style={{
                fontFamily: 'var(--font-head)', fontSize: '32px', fontWeight: 800,
                color: 'var(--white)', lineHeight: 1, marginBottom: '4px',
              }}>{value}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text2)' }}>{label}</div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '10px',
                color: 'var(--text3)', marginTop: '2px',
              }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* ── Supplier grid header ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '18px',
          flexWrap: 'wrap', gap: '10px',
        }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-head)', fontSize: '18px',
              fontWeight: 700, color: 'var(--white)',
            }}>Supplier Risk Matrix</h2>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontFamily: 'var(--font-mono)', fontSize: '10px',
              color: 'var(--text3)', marginTop: '4px',
            }}>
              <Clock size={10} />
              {risks.length} supplier(s) · Updated {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '16px',
          }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: '190px' }} />
            ))}
          </div>
        ) : risks.length === 0 ? (
          <EmptyState
            icon={<Package size={40} />}
            title="No suppliers monitored"
            desc="Add suppliers from the Suppliers page to begin tracking risk signals."
          />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '16px',
          }}>
            {risks.map((r, i) => (
              <div key={r.supplier_id} className={`d${Math.min(i + 1, 6)}`}>
                <SupplierCard supplier={r} score={r} />
              </div>
            ))}
          </div>
        )}

        {/* ── Recent alerts ── */}
        {alerts.length > 0 && (
          <div style={{ marginTop: '36px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Zap size={15} color="var(--gold)" />
                <h2 style={{
                  fontFamily: 'var(--font-head)', fontSize: '18px',
                  fontWeight: 700, color: 'var(--white)',
                }}>Recent Alerts</h2>
                {unread > 0 && (
                  <span style={{
                    padding: '2px 9px', borderRadius: '20px',
                    fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600,
                    background: 'rgba(240,180,41,0.12)', color: 'var(--gold)',
                    border: '1px solid rgba(240,180,41,0.25)',
                  }}>{unread} new</span>
                )}
              </div>
              <a href="/alerts" style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                fontSize: '12px', color: 'var(--text3)',
                textDecoration: 'none', transition: 'color 0.2s',
                fontFamily: 'var(--font-mono)',
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
              >
                View all <ArrowRight size={12} />
              </a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {alerts.slice(0, 3).map((alert, i) => {
                const isHigh = alert.message?.includes('HIGH');
                const isMed  = alert.message?.includes('MEDIUM');
                const accentColor = isHigh ? '#f43f5e' : isMed ? 'var(--gold)' : '#10b981';
                return (
                  <div key={alert.alert_id} className={`animate-fadeUp d${i + 1}`} style={{
                    background: alert.is_read ? 'var(--panel)' : 'rgba(240,180,41,0.03)',
                    border: `1px solid ${alert.is_read ? 'var(--border)' : 'rgba(240,180,41,0.15)'}`,
                    borderLeft: `3px solid ${alert.is_read ? 'var(--border3)' : accentColor}`,
                    borderRadius: 'var(--radius)',
                    padding: '16px 18px',
                    transition: 'all 0.2s',
                    opacity: alert.is_read ? 0.65 : 1,
                  }}>
                    <p style={{
                      fontSize: '13px', color: 'var(--text)',
                      lineHeight: 1.65, marginBottom: '8px',
                    }}>{alert.message}</p>
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: '10px',
                      color: 'var(--text3)',
                      display: 'flex', alignItems: 'center', gap: '5px',
                    }}>
                      <Clock size={10} />
                      {new Date(alert.created_at).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function EmptyState({ icon, title, desc }) {
  return (
    <div style={{
      textAlign: 'center', padding: '80px 40px',
      background: 'var(--panel)',
      border: '1px dashed var(--border2)',
      borderRadius: 'var(--radius)',
    }}>
      <div style={{
        color: 'var(--gold)', opacity: 0.25,
        display: 'flex', justifyContent: 'center', marginBottom: '18px',
      }}>{icon}</div>
      <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text2)', marginBottom: '8px' }}>{title}</p>
      <p style={{ fontSize: '13px', color: 'var(--text3)' }}>{desc}</p>
    </div>
  );
}