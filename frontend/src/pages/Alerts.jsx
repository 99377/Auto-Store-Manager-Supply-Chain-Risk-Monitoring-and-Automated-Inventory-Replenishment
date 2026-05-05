import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import API from '../api/axios';
import { Bell, CheckCheck, AlertTriangle, AlertCircle, CheckCircle, Clock, Filter } from 'lucide-react';

const LEVEL = {
  HIGH: {
    color: '#f43f5e', bg: 'rgba(244,63,94,0.07)',
    border: 'rgba(244,63,94,0.2)', accent: '#f43f5e',
    icon: AlertTriangle, label: 'HIGH',
  },
  MEDIUM: {
    color: '#f0b429', bg: 'rgba(240,180,41,0.06)',
    border: 'rgba(240,180,41,0.2)', accent: '#f0b429',
    icon: AlertCircle, label: 'MEDIUM',
  },
  LOW: {
    color: '#10b981', bg: 'rgba(16,185,129,0.06)',
    border: 'rgba(16,185,129,0.2)', accent: '#10b981',
    icon: CheckCircle, label: 'LOW',
  },
};

function getLevel(msg) {
  if (msg?.includes('HIGH'))   return 'HIGH';
  if (msg?.includes('MEDIUM')) return 'MEDIUM';
  return 'LOW';
}

export default function Alerts() {
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');

  const fetchAlerts = async () => {
    try { const r = await API.get('/api/alerts'); setAlerts(r.data); }
    catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchAlerts(); }, []);

  const markRead = async (id) => {
    try {
      await API.put(`/api/alerts/${id}/read`);
      setAlerts(prev => prev.map(a => a.alert_id === id ? { ...a, is_read: 1 } : a));
    } catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    const unread = alerts.filter(a => !a.is_read);
    await Promise.all(unread.map(a => API.put(`/api/alerts/${a.alert_id}/read`)));
    setAlerts(prev => prev.map(a => ({ ...a, is_read: 1 })));
  };

  const filtered   = filter === 'unread' ? alerts.filter(a => !a.is_read) : alerts;
  const unreadCount = alerts.filter(a => !a.is_read).length;
  const highCount   = alerts.filter(a => getLevel(a.message) === 'HIGH').length;

  return (
    <Layout>
      <div className="animate-fadeUp">

        {/* ── Header ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: '28px',
          flexWrap: 'wrap', gap: '14px',
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '10px',
              color: 'var(--gold)', letterSpacing: '2.5px', marginBottom: '7px',
            }}>NOTIFICATIONS</div>
            <h1 style={{
              fontFamily: 'var(--font-head)', fontSize: 'clamp(22px,3vw,32px)',
              fontWeight: 800, color: 'var(--white)', letterSpacing: '-0.5px', marginBottom: '6px',
            }}>Alerts</h1>
            <p style={{ fontSize: '14px', color: 'var(--text2)' }}>
              {unreadCount > 0 ? (
                <><span style={{ color: 'var(--gold)', fontWeight: 600 }}>{unreadCount} unread</span> · </>
              ) : null}
              {alerts.length} total
              {highCount > 0 ? (
                <> · <span style={{ color: '#f43f5e', fontWeight: 600 }}>{highCount} high priority</span></>
              ) : null}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Filter pills */}
            <div style={{
              display: 'flex', gap: '4px',
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: '10px', padding: '4px',
            }}>
              {['all', 'unread'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '6px 14px', borderRadius: '8px',
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  background: filter === f ? 'rgba(240,180,41,0.12)' : 'transparent',
                  border: filter === f ? '1px solid rgba(240,180,41,0.25)' : '1px solid transparent',
                  color: filter === f ? 'var(--gold)' : 'var(--text2)',
                  transition: 'all 0.2s',
                }}>
                  {f === 'all' ? 'All' : `Unread ${unreadCount > 0 ? `(${unreadCount})` : ''}`}
                </button>
              ))}
            </div>

            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '10px',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                background: 'rgba(16,185,129,0.07)',
                border: '1px solid rgba(16,185,129,0.2)',
                color: '#34d399', transition: 'all 0.2s',
              }}>
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>
        </div>

        {/* ── Summary bar ── */}
        {alerts.length > 0 && (
          <div style={{
            display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap',
          }}>
            {Object.entries(LEVEL).map(([key, cfg]) => {
              const count = alerts.filter(a => getLevel(a.message) === key).length;
              if (count === 0) return null;
              return (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '8px 14px', borderRadius: '10px',
                  background: cfg.bg, border: `1px solid ${cfg.border}`,
                  color: cfg.color,
                }}>
                  <cfg.icon size={13} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>
                    {count} {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: '90px' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 40px',
            background: 'var(--panel)',
            border: '1px dashed var(--border2)',
            borderRadius: 'var(--radius)',
          }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: 'rgba(240,180,41,0.08)',
              border: '1px solid rgba(240,180,41,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px',
            }}>
              <Bell size={24} style={{ color: 'var(--gold)', opacity: 0.5 }} />
            </div>
            <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text2)', marginBottom: '8px' }}>
              {filter === 'unread' ? 'All caught up!' : 'No alerts yet'}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text3)' }}>
              {filter === 'unread' ? 'No unread alerts at the moment.' : 'Run the pipeline to generate risk alerts.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map((alert, i) => {
              const level = getLevel(alert.message);
              const cfg   = LEVEL[level];
              const LevelIcon = cfg.icon;

              return (
                <div key={alert.alert_id} className={`animate-fadeUp d${Math.min(i + 1, 6)}`} style={{
                  background: alert.is_read ? 'var(--panel)' : cfg.bg,
                  border: `1px solid ${alert.is_read ? 'var(--border)' : cfg.border}`,
                  borderLeft: `3px solid ${alert.is_read ? 'var(--border2)' : cfg.accent}`,
                  borderRadius: 'var(--radius)',
                  padding: '18px 20px',
                  display: 'flex', gap: '14px', alignItems: 'flex-start',
                  transition: 'all 0.2s',
                  opacity: alert.is_read ? 0.6 : 1,
                }}>
                  {/* Icon */}
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: alert.is_read ? 'rgba(255,255,255,0.03)' : cfg.bg,
                    border: `1px solid ${alert.is_read ? 'var(--border)' : cfg.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: alert.is_read ? 'var(--text3)' : cfg.color,
                    flexShrink: 0,
                  }}>
                    <LevelIcon size={15} />
                  </div>

                  {/* Body */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '2px 9px', borderRadius: '6px',
                        fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
                        background: cfg.bg, color: cfg.color,
                        border: `1px solid ${cfg.border}`,
                        letterSpacing: '0.5px',
                      }}>{level} RISK</span>
                      {!alert.is_read && (
                        <span style={{
                          padding: '2px 7px', borderRadius: '5px',
                          fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 600,
                          background: 'rgba(240,180,41,0.1)', color: 'var(--gold)',
                          border: '1px solid rgba(240,180,41,0.2)',
                        }}>NEW</span>
                      )}
                    </div>

                    <p style={{
                      fontSize: '13px',
                      color: alert.is_read ? 'var(--text2)' : 'var(--text)',
                      lineHeight: 1.7, marginBottom: '10px',
                    }}>
                      {alert.message}
                    </p>

                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      flexWrap: 'wrap', gap: '8px',
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '10px',
                        color: 'var(--text3)',
                        display: 'flex', alignItems: 'center', gap: '5px',
                      }}>
                        <Clock size={10} />
                        {new Date(alert.created_at).toLocaleString()}
                      </span>

                      {!alert.is_read && (
                        <button onClick={() => markRead(alert.alert_id)} style={{
                          display: 'flex', alignItems: 'center', gap: '5px',
                          padding: '5px 12px',
                          background: 'transparent',
                          border: '1px solid var(--border2)',
                          borderRadius: '8px',
                          color: 'var(--text3)', fontSize: '11px',
                          cursor: 'pointer', fontFamily: 'var(--font-body)',
                          transition: 'all 0.2s',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text3)'; }}
                        >
                          <CheckCheck size={11} /> Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}