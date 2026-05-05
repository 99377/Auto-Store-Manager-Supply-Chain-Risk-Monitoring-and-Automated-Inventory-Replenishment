import { useState } from 'react';
import Layout from '../components/Layout';
import { HelpCircle, ChevronDown, ChevronUp, BookOpen, Zap, AlertTriangle, Package, Activity } from 'lucide-react';

const FAQS = [
  { q: 'How does Auto Store Manager detect risks?', a: 'Auto Store Manager fetches news from NewsAPI and GDELT every 3 hours, then runs a zero-shot NLP classifier (BART/DistilBERT) to categorize each article into one of 4 risk categories. It then calculates a composite risk score for each supplier based on geographic proximity, event severity, and recency.' },
  { q: 'What are the 4 risk categories?', a: 'Weather/Natural Disasters (floods, cyclones, drought), Political Unrest/Strikes (bandh, protests, shutdowns), Price Surge/Inflation (commodity price spikes, fuel hikes), and Transport/Road Disruption (highway blockage, rail strikes, road closures).' },
  { q: 'How is the risk score calculated?', a: 'Risk Score = Σ [confidence × category_weight × geo_proximity × temporal_decay] × 100. Category weights: Weather 35%, Unrest 30%, Price 20%, Transport 15%. Scores above 70 = HIGH, 40-69 = MEDIUM, below 40 = LOW.' },
  { q: 'How do I add a supplier?', a: 'Go to the Suppliers page → click "Add Supplier" → fill in the name, address, district, state, and product category → click Register Supplier. The supplier will be included in the next pipeline run.' },
  { q: 'How often does the pipeline run?', a: 'Automatically every 3 hours. You can also trigger it manually from the Dashboard by clicking "Run Pipeline". Manual runs are rate-limited to once per hour to respect API limits.' },
  { q: 'Why is my supplier showing 0 risk score?', a: 'The pipeline may not have run yet after adding the supplier. Click "Run Pipeline" on the dashboard and wait ~60 seconds for results. Also check that the district name matches exactly with news coverage areas.' },
  { q: 'What does NewsAPI free tier limit mean?', a: 'NewsAPI free tier allows 100 requests/day. Auto Store Manager batches queries by district (not per supplier) to stay within this limit. GDELT is used as an unlimited backup source.' },
];

const GUIDES = [
  { icon: Package, color: '#06b6d4', title: 'Getting Started', steps: ['Register your account', 'Add your suppliers with their district/state', 'Run the pipeline from Dashboard', 'View risk scores on supplier cards', 'Check Alerts for notifications'] },
  { icon: Activity, color: '#f59e0b', title: 'Understanding Risk Scores', steps: ['0-39: LOW — supply chain appears stable', '40-69: MEDIUM — monitor closely, check stocks', '70-100: HIGH — immediate action recommended', 'Score updates every 3 hours automatically', 'Click Run Pipeline for instant update'] },
  { icon: AlertTriangle, color: '#ef4444', title: 'Managing Alerts', steps: ['Alerts appear when risk score crosses 40+', 'HIGH risk triggers both in-app and email alerts', 'Go to Alerts page to view all notifications', 'Mark alerts as read once reviewed', 'Use filter to show only unread alerts'] },
];

export default function Help() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <Layout>
      <div className="animate-fadeUp">
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--amber)', letterSpacing: '2px', marginBottom: '6px' }}>DOCUMENTATION</div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(22px,3vw,30px)', fontWeight: 800, color: 'var(--white)', marginBottom: '5px' }}>Help Center</h1>
          <p style={{ fontSize: '14px', color: 'var(--text2)' }}>Everything you need to use Auto Store Manager effectively</p>
        </div>

        {/* Guides */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px', marginBottom: '28px' }}>
          {GUIDES.map(({ icon: Icon, color, title, steps }, i) => (
            <div key={title} className={`animate-fadeUp d${i + 1}`} style={{
              background: 'var(--panel)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '22px',
              transition: 'all 0.25s'
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}44`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: `${color}12`, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                  <Icon size={18} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '14px', fontWeight: 700, color: 'var(--white)' }}>{title}</h3>
              </div>
              <ol style={{ paddingLeft: '16px' }}>
                {steps.map((step, idx) => (
                  <li key={idx} style={{ fontSize: '12.5px', color: 'var(--text2)', padding: '4px 0', lineHeight: 1.55 }}>{step}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HelpCircle size={18} color="var(--amber)" />
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: 700, color: 'var(--white)' }}>Frequently Asked Questions</h2>
          </div>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderBottom: i < FAQS.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{
                width: '100%', padding: '18px 24px', background: openFaq === i ? 'rgba(245,158,11,0.04)' : 'none',
                border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', gap: '16px', textAlign: 'left', transition: 'background 0.2s'
              }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: openFaq === i ? 'var(--amber)' : 'var(--white)', lineHeight: 1.4 }}>
                  {faq.q}
                </span>
                <div style={{ color: 'var(--amber)', flexShrink: 0 }}>
                  {openFaq === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </button>
              {openFaq === i && (
                <div className="animate-fadeIn" style={{ padding: '0 24px 18px', fontSize: '13.5px', color: 'var(--text2)', lineHeight: 1.75, borderLeft: '3px solid var(--amber)', marginLeft: '24px' }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact */}
        <div style={{
          background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 'var(--radius)', padding: '24px', textAlign: 'center'
        }}>
          <Zap size={24} color="var(--amber)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '17px', fontWeight: 700, color: 'var(--white)', marginBottom: '8px' }}>Need More Help?</h3>
          <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '16px' }}>
            Auto Store Manager is a Final Year Project. For technical queries, check the project documentation or contact the developer.
          </p>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--amber)' }}>
            Auto Store Manager v1.0 · Final Year Major Project · 2025–26
          </div>
        </div>
      </div>
    </Layout>
  );
}