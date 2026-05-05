import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import BrandLogo from '../components/BrandLogo';
import { ArrowRight, Eye, EyeOff, Zap } from 'lucide-react';

export default function Register() {
  const [form, setForm]       = useState({
    name: '',
    business_name: '',
    email: '',
    phone_number: '',
    address: '',
    password: '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await API.post('/api/auth/register', form);
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    }
    setLoading(false);
  };

  const fields = [
    { key: 'name',          label: 'Full Name',      type: 'text',     placeholder: 'Lakshay Sharma' },
    { key: 'business_name', label: 'Business Name',  type: 'text',     placeholder: 'Sharma Kirana Store' },
    { key: 'email',         label: 'Email Address',  type: 'email',    placeholder: 'you@company.com' },
    { key: 'phone_number',  label: 'Phone Number',   type: 'tel',      placeholder: '+91XXXXXXXXXX' },
    { key: 'address',       label: 'Owner Address',  type: 'text',     placeholder: 'Boring Road, Patna' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-body)',
      position: 'relative',
      overflow: 'hidden',
      padding: '32px 20px',
    }}>
      {/* ── Ambient ── */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse 70% 60% at 80% 20%, rgba(240,180,41,0.04) 0%, transparent 60%),
          radial-gradient(ellipse 50% 70% at 20% 80%, rgba(14,165,233,0.03) 0%, transparent 60%)
        `,
      }} />
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'radial-gradient(circle, var(--dot-grid) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        maskImage: 'radial-gradient(ellipse 70% 80% at 50% 50%, black, transparent)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 80% at 50% 50%, black, transparent)',
      }} />

      <div className="animate-fadeUp" style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ margin: '0 auto 20px', width: 'fit-content', animation: 'pulse-soft 3s ease-in-out infinite' }}>
            <BrandLogo size={58} />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-head)', fontSize: '26px', fontWeight: 800,
            color: 'var(--white)', marginBottom: '6px', letterSpacing: '-0.3px',
          }}>Create your account</h1>
          <p style={{ color: 'var(--text2)', fontSize: '14px' }}>Start monitoring your supply chain today</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(240,180,41,0.4), transparent)',
          }} />

          {error && (
            <div className="animate-fadeIn" style={{
              background: 'rgba(244,63,94,0.08)',
              border: '1px solid rgba(244,63,94,0.2)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px', marginBottom: '20px',
              fontSize: '13px', color: '#f87171',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {fields.map(({ key, label, type, placeholder }) => (
              <div key={key} style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>{label}</label>
                <input
                  type={type} required
                  value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  style={inputStyle}
                />
              </div>
            ))}

            {/* Password with toggle */}
            <div style={{ marginBottom: '26px' }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'} required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 8 characters"
                  style={{ ...inputStyle, paddingRight: '44px' }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{
                  position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text3)', display: 'flex', padding: '4px',
                  transition: 'color 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px',
              background: loading
                ? 'rgba(240,180,41,0.4)'
                : 'linear-gradient(135deg, var(--gold), #d97706)',
              border: 'none', borderRadius: 'var(--radius-sm)',
              color: '#000', fontWeight: 700, fontSize: '14px',
              fontFamily: 'var(--font-body)',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(240,180,41,0.3)',
              letterSpacing: '0.3px',
            }}>
              {loading ? (
                <><span className="spin" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%' }} /> Creating account…</>
              ) : (
                <>Create Account <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div style={{ margin: '22px 0', borderTop: '1px solid var(--border)', position: 'relative' }}>
            <span style={{
              position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
              background: 'var(--panel)', padding: '0 12px',
              fontSize: '12px', color: 'var(--text3)',
            }}>or</span>
          </div>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text2)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{
              color: 'var(--gold)', textDecoration: 'none', fontWeight: 600,
            }}>Sign in →</Link>
          </p>
        </div>

        <div style={{
          textAlign: 'center', marginTop: '24px',
          fontFamily: 'var(--font-mono)', fontSize: '10px',
          color: 'var(--text3)', letterSpacing: '1px',
        }}>
          <Zap size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px', color: 'var(--gold)' }} />
          AUTO STORE MANAGER v1.0 · SMART RETAIL OPERATIONS PLATFORM
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: '12px', fontWeight: 600,
  color: 'var(--text2)', marginBottom: '7px', letterSpacing: '0.3px',
};

const inputStyle = {
  width: '100%', padding: '11px 14px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--border2)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--white)', fontSize: '14px',
  fontFamily: 'var(--font-body)',
  boxSizing: 'border-box', transition: 'all 0.2s',
};