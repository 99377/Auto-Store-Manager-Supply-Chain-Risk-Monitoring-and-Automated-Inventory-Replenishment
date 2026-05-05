import Layout from '../components/Layout';
import BrandLogo from '../components/BrandLogo';
import { Shield, Zap, Globe, Brain, BarChart2, Bell } from 'lucide-react';
const features = [
  { icon: Globe, color: '#06b6d4', title: 'Multi-Source Intelligence', desc: 'Aggregates data from NewsAPI, GDELT global event database, and OpenWeatherMap to build a comprehensive risk picture.' },
  { icon: Brain, color: '#8b5cf6', title: 'NLP Risk Classification', desc: 'Fine-tuned DistilBERT model classifies news articles into 4 risk categories with high accuracy. Zero-shot fallback ensures 100% coverage.' },
  { icon: BarChart2, color: '#f59e0b', title: 'Dynamic Risk Scoring', desc: 'Proprietary scoring formula considers confidence, category weight, geographic proximity, and temporal decay for precise supplier risk scores.' },
  { icon: Bell, color: '#ef4444', title: 'Intelligent Alerts', desc: 'Automatic plain-English alerts triggered when risk crosses thresholds — in-app notifications keep business owners informed instantly.' },
  { icon: Zap, color: '#10b981', title: 'Scheduled Pipeline', desc: 'Automated data pipeline runs every 3 hours ensuring risk scores are always current without manual intervention.' },
  { icon: Shield, color: '#f59e0b', title: 'Built for India', desc: 'Designed specifically for Indian supply chains — covers districts, states, commodity categories, and India-specific risk patterns.' },
];

const team = [
  { name: 'Auto Store Manager System', role: 'AI Risk & Inventory Intelligence Platform', init: 'A' },
  { name: 'Lakshay', role: 'Backend & Risk Pipeline Engineer · Final Year B.Tech/BCA', init: 'L' },
  { name: 'Puneet Kumar', role: 'Backend, AI/ML & Database · Final Year B.Tech/BCA', init: 'P' },
  { name: 'Deepak Kumar Bind', role: 'Frontend React Vite & Authenticator Support · Final Year B.Tech/BCA', init: 'D' },
  { name: 'Shiv Yadav', role: 'Frontend Support & System Integration · Final Year B.Tech/BCA', init: 'S' },
];

export default function About() {
  return (
    <Layout>
      <div className="animate-fadeUp">
        {/* Hero */}
        <div style={{
          background: 'var(--panel)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: 'clamp(28px, 5vw, 56px)',
          marginBottom: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 0%, rgba(245,158,11,0.06), transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ width: 'fit-content', margin: '0 auto 20px' }}>
            <BrandLogo size={64} />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--amber)', letterSpacing: '3px', marginBottom: '10px' }}>ABOUT THE PROJECT</div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: 'var(--white)', marginBottom: '16px' }}>
            Auto Store Manager
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text2)', maxWidth: '600px', margin: '0 auto 24px', lineHeight: 1.75 }}>
            A real-time supply chain risk monitoring system built for small Indian businesses — kirana stores and local manufacturers — who need affordable, intelligent visibility into supplier disruptions.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Final Year Project', 'B.Tech / BCA', '2025–26', 'AI/ML'].map(t => (
              <span key={t} style={{
                padding: '5px 14px', borderRadius: '20px',
                fontFamily: 'var(--font-mono)', fontSize: '11px',
                background: 'rgba(245,158,11,0.08)', color: 'var(--amber)',
                border: '1px solid rgba(245,158,11,0.2)'
              }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Features */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '20px', fontWeight: 700, color: 'var(--white)', marginBottom: '16px' }}>Core Features</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
            {features.map(({ icon: Icon, color, title, desc }, i) => (
              <div key={title} className={`animate-fadeUp d${Math.min(i + 1, 6)}`} style={{
                background: 'var(--panel)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '22px',
                transition: 'all 0.25s', position: 'relative', overflow: 'hidden'
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}44`; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${color}, transparent)` }} />
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${color}12`, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', color }}>
                  <Icon size={20} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '14px', fontWeight: 700, color: 'var(--white)', marginBottom: '8px' }}>{title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: 700, color: 'var(--white)', marginBottom: '18px' }}>Technology Stack</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {[
              { layer: 'Backend', tech: 'Python + FastAPI', color: '#06b6d4' },
              { layer: 'Database', tech: 'MySQL 8.0', color: '#f59e0b' },
              { layer: 'Frontend', tech: 'React + Vite', color: '#61dafb' },
              { layer: 'NLP Model', tech: 'DistilBERT / BART', color: '#8b5cf6' },
              { layer: 'News Data', tech: 'NewsAPI + GDELT', color: '#10b981' },
              { layer: 'Weather', tech: 'OpenWeatherMap', color: '#06b6d4' },
              { layer: 'Auth', tech: 'JWT + bcrypt', color: '#f59e0b' },
              { layer: 'Scheduler', tech: 'APScheduler', color: '#ef4444' },
            ].map(({ layer, tech, color }) => (
              <div key={layer} style={{
                padding: '12px 16px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px' }}>{layer}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color }}>{tech}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: 700, color: 'var(--white)', marginBottom: '18px' }}>Project Info</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
            {team.map(({ name, role, init }) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: 'rgba(245,158,11,0.03)', border: '1px solid rgba(245,158,11,0.1)', borderRadius: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--amber), #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '18px', color: '#000', flexShrink: 0 }}>
                  {init}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--white)', fontSize: '14px' }}>{name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>{role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}