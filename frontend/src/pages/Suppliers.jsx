import { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import API from '../api/axios';
import { Plus, Trash2, X, Check, MapPin, Search, ChevronDown, Package } from 'lucide-react';
import ReactDOM from 'react-dom';

const CATS   = ['Rice & Grains','Pulses','Spices','Oil & Ghee','Sugar & Salt','Tea & Coffee','Snacks','Beverages','Dairy','Cleaning','Personal Care','Vegetables','Packed Foods','Electronics','Textiles','Raw Materials','Other'];
const STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

const inp = {
  width: '100%', padding: '11px 14px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--border2)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text)', fontSize: '13px',
  fontFamily: 'var(--font-body)',
  boxSizing: 'border-box', transition: 'all 0.2s',
};

function CustomDropdown({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const triggerRef = useRef();
  const menuRef = useRef();

  useEffect(() => {
    const handleClose = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClose);
    return () => document.removeEventListener('mousedown', handleClose);
  }, []);

  const toggleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
    setOpen(!open);
  };

  const menu = open && ReactDOM.createPortal(
    <div ref={menuRef} style={{
      ...menuStyle,
      background: 'var(--panel)',
      border: '1px solid var(--border2)',
      borderRadius: 'var(--radius-sm)',
      boxShadow: 'var(--shadow)',
      maxHeight: '220px',
      overflowY: 'auto',
    }}>
      {options.map(opt => (
        <div
          key={opt}
          onClick={() => { onChange(opt); setOpen(false); }}
          style={{
            padding: '10px 14px',
            fontSize: '13px',
            cursor: 'pointer',
            color: value === opt ? 'var(--gold)' : 'var(--text)',
            background: value === opt ? 'rgba(240,180,41,0.08)' : 'transparent',
            fontWeight: value === opt ? 600 : 400,
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            if (value !== opt) {
              e.currentTarget.style.background = 'rgba(240,180,41,0.08)';
              e.currentTarget.style.color = 'var(--gold2)';
            }
          }}
          onMouseLeave={e => {
            if (value !== opt) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text)';
            }
          }}
        >
          {opt}
          {value === opt && <Check size={12} color="var(--gold)" />}
        </div>
      ))}
    </div>,
    document.body
  );

  return (
    <div ref={triggerRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={toggleOpen}
        style={{
          ...inp,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          borderColor: open ? 'var(--gold)' : 'var(--border2)',
          boxShadow: open ? '0 0 0 3px rgba(240,180,41,0.1)' : 'none',
          textAlign: 'left',
        }}
      >
        <span style={{
          color: value ? 'var(--text)' : 'var(--text3)',
          fontSize: '13px',
          fontWeight: 400,
          fontFamily: 'var(--font-body)',
        }}>
          {value || placeholder}
        </span>
        <ChevronDown size={13} color="var(--text3)" style={{
          flexShrink: 0,
          transition: 'transform 0.2s',
          transform: open ? 'rotate(180deg)' : 'none',
        }} />
      </button>
      {menu}
    </div>
  );
}


export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState('');
  const [form, setForm]           = useState({
    supplier_name: '',
    email: '',
    phone_number: '',
    location: '',
    district: '',
    state: '',
    product_category: '',
  });

  const fetchSuppliers = async () => {
    try { const r = await API.get('/api/suppliers/'); setSuppliers(r.data); }
    catch (e) { console.error(e); }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.state || !form.product_category) { alert('Please select State and Category'); return; }
    setLoading(true);
    try {
      await API.post('/api/suppliers/', form);
      setForm({
        supplier_name: '',
        email: '',
        phone_number: '',
        location: '',
        district: '',
        state: '',
        product_category: '',
      });
      setShowForm(false);
      fetchSuppliers();
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this supplier from monitoring?')) return;
    try { await API.delete(`/api/suppliers/${id}`); fetchSuppliers(); }
    catch (e) { console.error(e); }
  };

  const filtered = suppliers.filter(s =>
    s.supplier_name.toLowerCase().includes(search.toLowerCase()) ||
    s.district?.toLowerCase().includes(search.toLowerCase()) ||
    s.product_category?.toLowerCase().includes(search.toLowerCase())
  );

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
            }}>SUPPLIER REGISTRY</div>
            <h1 style={{
              fontFamily: 'var(--font-head)', fontSize: 'clamp(22px,3vw,32px)',
              fontWeight: 800, color: 'var(--white)', letterSpacing: '-0.5px', marginBottom: '5px',
            }}>Suppliers</h1>
            <p style={{ fontSize: '14px', color: 'var(--text2)' }}>
              {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''} under active monitoring
            </p>
          </div>

          <button onClick={() => setShowForm(!showForm)} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '11px 20px',
            background: showForm
              ? 'rgba(244,63,94,0.08)'
              : 'linear-gradient(135deg, var(--gold), #d97706)',
            border: showForm ? '1px solid rgba(244,63,94,0.25)' : 'none',
            borderRadius: 'var(--radius-sm)',
            color: showForm ? '#f87171' : '#000',
            fontSize: '13px', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'var(--font-body)',
            transition: 'all 0.2s',
            boxShadow: showForm ? 'none' : '0 4px 20px rgba(240,180,41,0.25)',
          }}>
            {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add Supplier</>}
          </button>
        </div>

        {/* ── Add Form ── */}
        {showForm && (
          <div className="animate-fadeUp" style={{
            background: 'var(--panel)',
            border: '1px solid rgba(240,180,41,0.2)',
            borderRadius: 'var(--radius)',
            padding: '26px', marginBottom: '24px',
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(240,180,41,0.05)',
          }}>
            {/* Top shimmer */}
            <div style={{
              position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(240,180,41,0.4), transparent)',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Plus size={15} color="var(--gold)" />
              </div>
              <h3 style={{
                fontFamily: 'var(--font-head)', fontSize: '16px',
                fontWeight: 700, color: 'var(--white)',
              }}>Register New Supplier</h3>
            </div>

            <form onSubmit={handleAdd}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                gap: '14px', marginBottom: '20px',
              }}>
                {[
                  { key: 'supplier_name', label: 'Supplier Name', placeholder: 'Sharma Rice Mills' },
                  { key: 'email',         label: 'Supplier Email', placeholder: 'supplier@company.com' },
                  { key: 'phone_number',  label: 'Supplier Phone', placeholder: '+91XXXXXXXXXX' },
                  { key: 'location',      label: 'Full Address',  placeholder: 'NH-31, Near APMC Market' },
                  { key: 'district',      label: 'District',      placeholder: 'Patna' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label style={labelStyle}>{label.toUpperCase()}</label>
                    <input
                      required placeholder={placeholder}
                      value={form[key]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      style={inp}
                    />
                  </div>
                ))}

                <div>
                  <label style={labelStyle}>STATE</label>
                  <CustomDropdown
                    value={form.state}
                    onChange={v => setForm({ ...form, state: v })}
                    options={STATES} placeholder="Select state…"
                  />
                </div>

                <div>
                  <label style={labelStyle}>PRODUCT CATEGORY</label>
                  <CustomDropdown
                    value={form.product_category}
                    onChange={v => setForm({ ...form, product_category: v })}
                    options={CATS} placeholder="Select category…"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '10px 22px',
                background: 'linear-gradient(135deg, var(--gold), #d97706)',
                border: 'none', borderRadius: 'var(--radius-sm)',
                color: '#000', fontWeight: 700, fontSize: '13px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 16px rgba(240,180,41,0.25)',
              }}>
                {loading ? (
                  <><span className="spin" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%' }} /> Saving…</>
                ) : (
                  <><Check size={14} /> Register Supplier</>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── Search bar ── */}
        <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '380px' }}>
          <Search size={14} style={{
            position: 'absolute', left: '13px', top: '50%',
            transform: 'translateY(-50%)', color: 'var(--text3)',
          }} />
          <input
            placeholder="Search suppliers, districts, categories…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inp, paddingLeft: '38px' }}
          />
        </div>

        {/* ── Table ── */}
        <div style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{
                  background: 'rgba(240,180,41,0.04)',
                  borderBottom: '1px solid var(--border)',
                }}>
                  {['Supplier', 'Email / Phone', 'Location', 'District / State', 'Category', 'Status', ''].map(h => (
                    <th key={h} style={{
                      padding: '13px 16px', textAlign: 'left',
                      fontFamily: 'var(--font-mono)', fontSize: '9.5px',
                      color: 'var(--gold)', letterSpacing: '1.5px',
                      fontWeight: 600, whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '60px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <Package size={32} style={{ color: 'var(--text3)', opacity: 0.4 }} />
                        <p style={{ fontSize: '14px', color: 'var(--text2)', fontWeight: 600 }}>
                          {search ? 'No suppliers match your search' : 'No suppliers yet'}
                        </p>
                        <p style={{ fontSize: '13px', color: 'var(--text3)' }}>
                          {search ? 'Try a different keyword' : 'Click "Add Supplier" to get started'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((s, i) => (
                  <tr key={s.supplier_id} style={{
                    borderTop: '1px solid var(--border)',
                    transition: 'background 0.15s',
                    animation: `fadeUp 0.4s ${i * 0.04}s both`,
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(240,180,41,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '13px' }}>
                        {s.supplier_name}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{s.email || '—'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '3px' }}>{s.phone_number || '—'}</div>
                    </td>
                    <td style={{ padding: '14px 16px', maxWidth: '160px' }}>
                      <div style={{
                        fontSize: '12px', color: 'var(--text2)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{s.location}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        fontSize: '12px', color: 'var(--text2)',
                      }}>
                        <MapPin size={10} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                        {s.district}, {s.state}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '6px',
                        fontFamily: 'var(--font-mono)', fontSize: '10px',
                        background: 'var(--teal-dim)', color: 'var(--teal)',
                        border: '1px solid rgba(14,165,233,0.2)',
                        fontWeight: 500,
                      }}>{s.product_category}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '6px',
                        fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600,
                        background: s.status === 'active' ? 'var(--green-dim)' : 'var(--red-dim)',
                        color: s.status === 'active' ? 'var(--green)' : 'var(--red)',
                        border: `1px solid ${s.status === 'active' ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
                      }}>{s.status}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => handleDelete(s.supplier_id)} style={{
                        background: 'var(--red-dim)',
                        border: '1px solid rgba(244,63,94,0.2)',
                        borderRadius: '8px', padding: '6px 9px',
                        cursor: 'pointer', color: 'var(--red)',
                        display: 'flex', alignItems: 'center',
                        transition: 'all 0.2s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.15)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.4)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--red-dim)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.2)'; }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

const labelStyle = {
  fontFamily: 'var(--font-mono)', fontSize: '9.5px',
  color: 'var(--text3)', display: 'block',
  marginBottom: '7px', letterSpacing: '1.5px',
};