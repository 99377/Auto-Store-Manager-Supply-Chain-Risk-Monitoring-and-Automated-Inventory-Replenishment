import { useState } from 'react';
import {
  MapPin, Package, AlertTriangle, CheckCircle, AlertCircle,
  ChevronDown, ChevronUp, ExternalLink, FileText,
} from 'lucide-react';

const RISK = {
  high: {
    color:  '#f43f5e',
    bg:     'rgba(244,63,94,0.07)',
    border: 'rgba(244,63,94,0.2)',
    glow:   'rgba(244,63,94,0.12)',
    bar:    'linear-gradient(90deg, #f43f5e, #fb7185)',
    icon:   AlertTriangle,
    label:  'HIGH RISK',
  },
  medium: {
    color:  '#f0b429',
    bg:     'rgba(240,180,41,0.07)',
    border: 'rgba(240,180,41,0.22)',
    glow:   'rgba(240,180,41,0.1)',
    bar:    'linear-gradient(90deg, #f0b429, #fbbf24)',
    icon:   AlertCircle,
    label:  'MEDIUM RISK',
  },
  low: {
    color:  '#10b981',
    bg:     'rgba(16,185,129,0.07)',
    border: 'rgba(16,185,129,0.18)',
    glow:   'rgba(16,185,129,0.08)',
    bar:    'linear-gradient(90deg, #10b981, #34d399)',
    icon:   CheckCircle,
    label:  'LOW RISK',
  },
};

const CAT_CONFIG = {
  weather:     { color: '#38bdf8', label: 'Weather'     },
  unrest:      { color: '#f43f5e', label: 'Unrest'      },
  price:       { color: '#f0b429', label: 'Price'       },
  transport:   { color: '#fb923c', label: 'Transport'   },
  agriculture: { color: '#4ade80', label: 'Agriculture' },
  industrial:  { color: '#a78bfa', label: 'Industrial'  },
};

function getCatCfg(cat) {
  return CAT_CONFIG[cat?.toLowerCase()] || { color: '#a78bfa', label: cat || 'General' };
}

export default function SupplierCard({ supplier, score }) {
  const [showEvidence, setShowEvidence] = useState(false);

  const level     = score?.risk_level || 'low';
  const normalizedLevel = level === 'low-medium' ? 'medium' : level;
  const cfg       = RISK[normalizedLevel] || RISK.low;
  const Icon      = cfg.icon;
  const riskScore = score?.risk_score ?? 0;
  const evidence  = score?.evidence || [];

  return (
    <div style={{
      background: 'var(--panel)',
      border: `1px solid ${cfg.border}`,
      borderRadius: 'var(--radius)',
      position: 'relative', overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
      boxShadow: `0 4px 24px ${cfg.glow}`,
      fontFamily: 'var(--font-body)',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 20px 48px ${cfg.glow}, 0 4px 24px rgba(0,0,0,0.5)`;
        e.currentTarget.style.borderColor = cfg.color + '55';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = `0 4px 24px ${cfg.glow}`;
        e.currentTarget.style.borderColor = cfg.border;
      }}
    >
      {/* ── Top accent bar ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: cfg.bar,
      }} />

      {/* ── Corner ambient glow ── */}
      <div style={{
        position: 'absolute', top: '-40px', right: '-40px',
        width: '120px', height: '120px', borderRadius: '50%',
        background: `radial-gradient(circle, ${cfg.glow} 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ padding: '22px', paddingTop: '24px' }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: '14px',
        }}>
          <div style={{ flex: 1, paddingRight: '10px' }}>
            <div style={{
              fontFamily: 'var(--font-head)', fontSize: '15px', fontWeight: 700,
              color: 'var(--white)', marginBottom: '5px', lineHeight: 1.3,
            }}>
              {supplier.supplier_name}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '12px', color: 'var(--text3)',
            }}>
              <MapPin size={10} style={{ color: cfg.color, flexShrink: 0 }} />
              {supplier.district}, {supplier.state}
            </div>
          </div>

          {/* Risk badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '5px 10px', borderRadius: '8px',
            background: cfg.bg, color: cfg.color,
            fontSize: '9px', fontWeight: 700,
            fontFamily: 'var(--font-mono)', letterSpacing: '0.5px',
            border: `1px solid ${cfg.border}`,
            flexShrink: 0, whiteSpace: 'nowrap',
          }}>
            <Icon size={10} /> {cfg.label}
          </div>
        </div>

        {/* ── Category tag ── */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '4px 10px', borderRadius: '7px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border)',
          fontSize: '11px', color: 'var(--text2)',
          marginBottom: '18px',
          fontFamily: 'var(--font-mono)',
        }}>
          <Package size={10} /> {supplier.product_category}
        </div>

        {/* ── Risk score ── */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'baseline', marginBottom: '10px',
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '10px',
              color: 'var(--text3)', letterSpacing: '1px',
            }}>RISK SCORE</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
              <span style={{
                fontFamily: 'var(--font-head)', fontSize: '22px',
                fontWeight: 800, color: cfg.color, lineHeight: 1,
              }}>{riskScore}</span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '11px',
                color: 'var(--text3)',
              }}>/100</span>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{
            height: '4px', background: 'rgba(255,255,255,0.05)',
            borderRadius: '4px', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${riskScore}%`,
              background: cfg.bar, borderRadius: '4px',
              transition: 'width 1.4s cubic-bezier(0.22,1,0.36,1)',
              boxShadow: `0 0 10px ${cfg.color}66`,
            }} />
          </div>

          {/* Threshold ticks */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginTop: '6px',
            fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text3)',
          }}>
            <span>0</span>
            <span style={{ color: 'rgba(240,180,41,0.4)' }}>40</span>
            <span style={{ color: 'rgba(244,63,94,0.4)' }}>70</span>
            <span>100</span>
          </div>
        </div>

        {/* ── Evidence toggle ── */}
        {evidence.length > 0 ? (
          <button onClick={() => setShowEvidence(!showEvidence)} style={{
            width: '100%', padding: '9px 12px',
            background: showEvidence ? 'rgba(240,180,41,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${showEvidence ? 'rgba(240,180,41,0.25)' : 'var(--border2)'}`,
            borderRadius: '10px',
            color: showEvidence ? 'var(--gold)' : 'var(--text2)',
            fontSize: '10px', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', letterSpacing: '0.8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => {
              if (!showEvidence) {
                e.currentTarget.style.background = 'rgba(240,180,41,0.06)';
                e.currentTarget.style.borderColor = 'rgba(240,180,41,0.2)';
                e.currentTarget.style.color = 'var(--gold)';
              }
            }}
            onMouseLeave={e => {
              if (!showEvidence) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = 'var(--border2)';
                e.currentTarget.style.color = 'var(--text2)';
              }
            }}
          >
            <FileText size={11} />
            {showEvidence ? 'HIDE' : 'VIEW'} EVIDENCE
            <span style={{
              padding: '1px 7px', borderRadius: '5px',
              background: 'rgba(240,180,41,0.1)', color: 'var(--gold)',
              border: '1px solid rgba(240,180,41,0.2)', fontSize: '9px',
            }}>{evidence.length}</span>
            {showEvidence ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        ) : (
          /* ── No signal state ── */
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '9px 12px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
            fontFamily: 'var(--font-mono)', fontSize: '10px',
            color: 'var(--text3)', letterSpacing: '0.8px',
          }}>
            <CheckCircle size={11} style={{ color: 'var(--green)' }} />
            NO RISK SIGNALS DETECTED
          </div>
        )}

        {/* ── Evidence panel ── */}
        {showEvidence && evidence.length > 0 && (
          <div style={{
            marginTop: '12px',
            display: 'flex', flexDirection: 'column', gap: '8px',
            animation: 'fadeUp 0.3s cubic-bezier(0.22,1,0.36,1) both',
          }}>
            {evidence.map((ev, i) => {
              const catCfg = getCatCfg(ev.category);
              return (
                <div key={i} style={{
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border)',
                  borderLeft: `2.5px solid ${catCfg.color}`,
                  borderRadius: '10px',
                  transition: 'border-color 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = `${catCfg.color}55`}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  {/* Category + confidence
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap',
                  }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: '5px',
                      fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
                      letterSpacing: '0.8px',
                      background: `${catCfg.color}18`, color: catCfg.color,
                      border: `1px solid ${catCfg.color}30`,
                    }}>
                      {catCfg.label.toUpperCase()}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text3)',
                    }}>
                      {Math.round(ev.confidence * 100)}
                      <span style={{ opacity: 0.6 }}>% CONF</span>
                    </span>
                  </div> */}
                  {/* Category + confidence + geo + contribution */}
                  <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap',
                  }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: '5px',
                    fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
                    letterSpacing: '0.8px',
                    background: `${catCfg.color}18`, color: catCfg.color,
                    border: `1px solid ${catCfg.color}30`,
                  }}>
                    {catCfg.label.toUpperCase()}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {/* Geo match badge */}
                    {ev.geo_match && (
                      <span style={{
                        padding: '2px 7px', borderRadius: '5px',
                        fontFamily: 'var(--font-mono)', fontSize: '9px',
                        letterSpacing: '0.5px',
                        background: ev.geo_match === 'district'
                          ? 'rgba(16,185,129,0.1)'
                          : ev.geo_match === 'state'
                          ? 'rgba(6,182,212,0.1)'
                          : 'rgba(148,163,184,0.08)',
                        color: ev.geo_match === 'district'
                          ? '#10b981'
                          : ev.geo_match === 'state'
                          ? '#06b6d4'
                          : '#64748b',
                        border: `1px solid ${
                          ev.geo_match === 'district'
                            ? 'rgba(16,185,129,0.2)'
                            : ev.geo_match === 'state'
                            ? 'rgba(6,182,212,0.2)'
                            : 'rgba(148,163,184,0.1)'
                        }`,
                      }}>
                        {ev.geo_match === 'district' ? '📍' : ev.geo_match === 'state' ? '🗺' : '🌐'} {ev.geo_match.toUpperCase()}
                      </span>
                    )}

                    {/* Confidence */}
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text3)',
                    }}>
                      {Math.round(ev.confidence * 100)}
                      <span style={{ opacity: 0.6 }}>% CONF</span>
                    </span>

                    {/* Score contribution */}
                    {ev.contribution !== undefined && (
                      <span style={{
                        padding: '2px 7px', borderRadius: '5px',
                        fontFamily: 'var(--font-mono)', fontSize: '9px',
                        background: 'rgba(240,180,41,0.08)',
                        color: 'var(--gold)',
                        border: '1px solid rgba(240,180,41,0.15)',
                      }}>
                        +{ev.contribution} pts
                      </span>
                    )}
                  </div>
                  </div>

                  {/* Article title */}
                  <p style={{
                    fontSize: '12px', color: 'var(--text)',
                    lineHeight: 1.65, marginBottom: '9px',
                  }}>
                    {ev.title?.length > 95 ? ev.title.slice(0, 95) + '…' : ev.title}
                  </p>

                  {ev.factors && (
                    <div style={{
                      marginBottom: '8px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9px',
                      color: 'var(--text3)',
                      lineHeight: 1.6,
                    }}>
                      W:{ev.factors.category_weight} · G:{ev.factors.geo_weight} · T:{ev.factors.time_decay} · P:{ev.factors.product_multiplier}
                    </div>
                  )}

                  {/* Source + link */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', gap: '8px',
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text3)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {ev.source?.toUpperCase()} · {ev.location}
                    </span>

                    {ev.url && (
                      <a href={ev.url} target="_blank" rel="noreferrer" style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        fontFamily: 'var(--font-mono)', fontSize: '9px',
                        color: 'var(--gold)', textDecoration: 'none',
                        flexShrink: 0, letterSpacing: '0.5px', transition: 'color 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--gold3)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--gold)'}
                      >
                        SOURCE <ExternalLink size={9} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Scored at footer */}
            {score?.scored_at && (
              <div style={{
                display: 'flex', justifyContent: 'flex-end', paddingTop: '4px',
                fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text3)',
              }}>
                Scored {new Date(score.scored_at).toLocaleString()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}