import { useEffect, useState, useMemo } from 'react';
import Layout from '../components/Layout';
import API from '../api/axios';
import toast from 'react-hot-toast';
import {
  Store, Save, Plus, Trash2, Search, Package, Layers, Upload, Copy, RefreshCw,
} from 'lucide-react';

const SHOP_TYPES = [
  'Kirana / General store',
  'Supermarket',
  'Grocery',
  'Convenience store',
  'Wholesale',
  'Other',
];

const PRODUCT_CATEGORIES = [
  'Rice & Grains','Pulses','Spices','Oil & Ghee','Sugar & Salt','Tea & Coffee','Snacks','Beverages','Dairy','Cleaning','Personal Care','Vegetables','Packed Foods','Electronics','Textiles','Raw Materials','Other',
];

const UNITS = ['pcs', 'kg', 'g', 'L', 'mL', 'dozen', 'packet', 'box'];

const inp = {
  width: '100%',
  padding: '11px 14px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--border2)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text)',
  fontSize: '13px',
  fontFamily: 'var(--font-body)',
  boxSizing: 'border-box',
};

export default function Inventory() {
  const [settings, setSettings] = useState({ shop_name: '', shop_type: '', shop_address: '', auto_order_enabled: 1 });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newRow, setNewRow] = useState({
    product_name: '',
    category: 'Other',
    quantity: '',
    unit: 'pcs',
  });
  const [saleQty, setSaleQty] = useState({});
  const [editQty, setEditQty] = useState({});
  const [integration, setIntegration] = useState({
    machine_name: '',
    machine_token: '',
    sync_url: '/api/billing/sync/machine',
  });
  const [savingIntegration, setSavingIntegration] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([
        API.get('/api/shop/settings'),
        API.get('/api/inventory/products'),
      ]);
      setSettings(s.data);
      setProducts(p.data);
      const bi = await API.get('/api/billing/integration');
      setIntegration(bi.data);
    } catch (e) {
      console.error(e);
      toast.error('Could not load shop inventory');
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const saveSettings = async (e) => {
    e?.preventDefault?.();
    if (!settings.shop_name?.trim()) {
      toast.error('Enter shop name');
      return;
    }
    setSettingsSaving(true);
    try {
      await API.put('/api/shop/settings', {
        shop_name: settings.shop_name.trim(),
        shop_type: (settings.shop_type || '').trim(),
        shop_address: (settings.shop_address || '').trim(),
        auto_order_enabled: settings.auto_order_enabled ? 1 : 0,
      });
      toast.success('Shop details saved');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Save failed');
    }
    setSettingsSaving(false);
  };

  const addProduct = async (e) => {
    e.preventDefault();
    if (!newRow.product_name?.trim()) {
      toast.error('Enter product name');
      return;
    }
    const qty = parseFloat(newRow.quantity);
    if (Number.isNaN(qty) || qty < 0) {
      toast.error('Enter a valid quantity');
      return;
    }
    try {
      await API.post('/api/inventory/products', {
        product_name: newRow.product_name.trim(),
        category: newRow.category || 'Other',
        quantity: qty,
        unit: newRow.unit || 'pcs',
      });
      toast.success('Product added');
      setNewRow({ product_name: '', category: 'Other', quantity: '', unit: 'pcs' });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not add product');
    }
  };

  const removeProduct = async (id) => {
    if (!window.confirm('Remove this product from your list?')) return;
    try {
      await API.delete(`/api/inventory/products/${id}`);
      toast.success('Removed');
      fetchAll();
    } catch {
      toast.error('Delete failed');
    }
  };

  const sellProduct = async (product) => {
    const raw = saleQty[product.product_id];
    const sold = parseFloat(raw);
    if (Number.isNaN(sold) || sold <= 0) {
      toast.error('Enter sold quantity');
      return;
    }
    try {
      await API.post(`/api/inventory/products/${product.product_id}/sell`, {
        quantity_sold: sold,
      });
      toast.success(`Sale recorded for ${product.product_name}`);
      setSaleQty((prev) => ({ ...prev, [product.product_id]: '' }));
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not record sale');
    }
  };

  const updateQuantity = async (product) => {
    const raw = editQty[product.product_id];
    const qtyToAdd = parseFloat(raw);
    if (Number.isNaN(qtyToAdd) || qtyToAdd <= 0) {
      toast.error('Enter quantity to add');
      return;
    }
    try {
      await API.put(`/api/inventory/products/${product.product_id}`, { quantity_delta: qtyToAdd });
      toast.success(`Added ${qtyToAdd} to ${product.product_name}`);
      setEditQty((prev) => ({ ...prev, [product.product_id]: '' }));
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not update quantity');
    }
  };

  const saveIntegration = async (regenerate = false) => {
    setSavingIntegration(true);
    try {
      const res = await API.put('/api/billing/integration', {
        machine_name: integration.machine_name || '',
        regenerate_token: regenerate,
      });
      setIntegration(res.data);
      toast.success(regenerate ? 'Machine token regenerated' : 'Billing integration saved');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not save integration');
    }
    setSavingIntegration(false);
  };

  const copyMachineToken = async () => {
    try {
      await navigator.clipboard.writeText(integration.machine_token || '');
      toast.success('Machine token copied');
    } catch {
      toast.error('Could not copy token');
    }
  };

  const importBillingCsv = async (file) => {
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
      if (lines.length < 2) {
        toast.error('CSV is empty');
        return;
      }

      const header = lines[0].toLowerCase();
      const headerCols = header.split(',').map((x) => x.trim());
      const nameIdx = headerCols.indexOf('product_name');
      const qtyIdx = headerCols.indexOf('quantity_sold');
      if (nameIdx === -1 || qtyIdx === -1) {
        toast.error('CSV must have headers: product_name,quantity_sold');
        return;
      }

      const items = lines.slice(1).map((line) => {
        const cols = line.split(',').map((x) => x.trim());
        return {
          product_name: cols[nameIdx] || '',
          quantity_sold: Number(cols[qtyIdx] || 0),
        };
      }).filter((x) => x.product_name && x.quantity_sold > 0);

      if (!items.length) {
        toast.error('No valid rows in CSV');
        return;
      }

      const res = await API.post('/api/billing/sync/manual', { items });
      const { updated, failed } = res.data;
      toast.success(`Billing import done: ${updated} updated, ${failed} failed`);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'CSV import failed');
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.product_name.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q),
    );
  }, [products, search]);

  const searchMatch = search.trim().length > 0;
  const inStock = (q) => Number(q) > 0;

  return (
    <Layout>
      <div className="animate-fadeUp" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 20,
            marginBottom: 28,
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, var(--gold), #b45309)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--glow-gold)',
                }}
              >
                <Store size={22} color="#000" strokeWidth={2.2} />
              </div>
              <div>
                <h1
                  style={{
                    fontFamily: 'var(--font-head)',
                    fontWeight: 800,
                    fontSize: 'clamp(1.35rem, 2vw, 1.65rem)',
                    color: 'var(--white)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  My shop inventory
                </h1>
                <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>
                  List products you keep in stock (e.g. kirana items). Search to see if an item is in your list and whether quantity is available.
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginLeft: 'auto', minWidth: 260, flex: '0 1 320px' }}>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text3)',
                letterSpacing: 1,
                marginBottom: 6,
              }}
            >
              SEARCH INVENTORY
            </label>
            <div style={{ position: 'relative' }}>
              <Search
                size={17}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text3)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="search"
                placeholder="Product or category…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...inp, paddingLeft: 40 }}
              />
            </div>
            {searchMatch && (
              <p style={{ fontSize: 11, color: 'var(--text2)', marginTop: 8 }}>
                {filtered.length === 0
                  ? 'No match in your inventory.'
                  : `${filtered.length} match${filtered.length === 1 ? '' : 'es'} — check quantity column for availability.`}
              </p>
            )}
          </div>
        </div>

        {/* Shop profile */}
        <form
          onSubmit={saveSettings}
          className="card"
          style={{ padding: 22, marginBottom: 24 }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--gold)',
              letterSpacing: 1,
            }}
          >
            <Layers size={14} />
            SHOP DETAILS
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              alignItems: 'end',
            }}
          >
            <div>
              <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>
                Shop name
              </label>
              <input
                style={inp}
                value={settings.shop_name}
                onChange={(e) => setSettings((s) => ({ ...s, shop_name: e.target.value }))}
                placeholder="e.g. Sharma General Store"
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>
                Type of shop / product focus
              </label>
              <select
                style={{ ...inp, cursor: 'pointer' }}
                value={settings.shop_type || ''}
                onChange={(e) => setSettings((s) => ({ ...s, shop_type: e.target.value }))}
              >
                <option value="">Select type…</option>
                {SHOP_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>
                Shop address
              </label>
              <input
                style={inp}
                value={settings.shop_address || ''}
                onChange={(e) => setSettings((s) => ({ ...s, shop_address: e.target.value }))}
                placeholder="e.g. Fraser Road, Patna"
              />
            </div>
            <button
              type="submit"
              disabled={settingsSaving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 20px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(240,180,41,0.35)',
                background: 'rgba(240,180,41,0.12)',
                color: 'var(--gold2)',
                fontWeight: 600,
                fontSize: 13,
                cursor: settingsSaving ? 'wait' : 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              <Save size={16} />
              {settingsSaving ? 'Saving…' : 'Save shop details'}
            </button>
          </div>
        </form>

        {/* External billing machine integration */}
        <div className="card" style={{ padding: 22, marginBottom: 24 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--violet)',
              letterSpacing: 1,
            }}
          >
            <RefreshCw size={14} />
            EXTERNAL BILLING MACHINE
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: 14,
              alignItems: 'end',
            }}
          >
            <div>
              <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>
                Billing machine name
              </label>
              <input
                style={inp}
                value={integration.machine_name || ''}
                onChange={(e) => setIntegration((x) => ({ ...x, machine_name: e.target.value }))}
                placeholder="e.g. Posiflex Counter-1"
              />
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>
                Sync endpoint
              </label>
              <input
                readOnly
                style={inp}
                value={`${import.meta.env.VITE_API_BASE_URL || window.location.origin}${integration.sync_url || '/api/billing/sync/machine'}`}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>
                Machine token (send in `X-Machine-Token` header)
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input readOnly style={{ ...inp, flex: 1 }} value={integration.machine_token || ''} />
                <button
                  type="button"
                  onClick={copyMachineToken}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border2)', background: 'var(--panel2)',
                    color: 'var(--text)', cursor: 'pointer',
                  }}
                >
                  <Copy size={14} />
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => saveIntegration(true)}
                  disabled={savingIntegration}
                  style={{
                    padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(124,58,237,0.35)', background: 'rgba(124,58,237,0.12)',
                    color: '#c4b5fd', cursor: savingIntegration ? 'wait' : 'pointer',
                  }}
                >
                  Regenerate token
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
            <button
              type="button"
              onClick={() => saveIntegration(false)}
              disabled={savingIntegration}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(240,180,41,0.35)',
                background: 'rgba(240,180,41,0.12)',
                color: 'var(--gold2)',
                cursor: savingIntegration ? 'wait' : 'pointer',
                fontWeight: 600,
              }}
            >
              <Save size={14} />
              Save machine setup
            </button>

            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(14,165,233,0.35)',
                background: 'rgba(14,165,233,0.12)',
                color: '#7dd3fc',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <Upload size={14} />
              Import bill CSV
              <input
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importBillingCsv(f);
                  e.target.value = '';
                }}
              />
            </label>
          </div>

          <p style={{ fontSize: 11, color: 'var(--text2)', marginTop: 10, lineHeight: 1.5 }}>
            Machine/API payload format: <span style={{ fontFamily: 'var(--font-mono)' }}>
              {`{"items":[{"product_name":"Tata Salt 1kg","quantity_sold":2}]}`}
            </span>
          </p>
        </div>

        {/* Add product row */}
        <form
          onSubmit={addProduct}
          className="card"
          style={{ padding: 22, marginBottom: 24 }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--teal)',
              letterSpacing: 1,
            }}
          >
            <Plus size={14} />
            ADD PRODUCT (STORE COLUMNS)
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 12,
              alignItems: 'end',
            }}
          >
            <div style={{ gridColumn: 'span 2', minWidth: 160 }}>
              <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>
                Product name
              </label>
              <input
                style={inp}
                value={newRow.product_name}
                onChange={(e) => setNewRow((r) => ({ ...r, product_name: e.target.value }))}
                placeholder="e.g. Tata Salt 1kg"
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>
                Category
              </label>
              <select
                style={{ ...inp, cursor: 'pointer' }}
                value={newRow.category}
                onChange={(e) => setNewRow((r) => ({ ...r, category: e.target.value }))}
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>
                Quantity in store
              </label>
              <input
                style={inp}
                type="number"
                min={0}
                step="any"
                value={newRow.quantity}
                onChange={(e) => setNewRow((r) => ({ ...r, quantity: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>
                Unit
              </label>
              <select
                style={{ ...inp, cursor: 'pointer' }}
                value={newRow.unit}
                onChange={(e) => setNewRow((r) => ({ ...r, unit: e.target.value }))}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 18px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'linear-gradient(135deg, var(--teal), #0369a1)',
                color: '#fff',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              <Package size={16} />
              Add to list
            </button>
          </div>
        </form>

        {/* Product table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text2)',
              letterSpacing: 1,
            }}
          >
            PRODUCTS IN YOUR STORE {loading ? '' : `(${products.length})`}
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Loading…</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '17%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '8%' }} />
                </colgroup>
                <thead>
                  <tr style={{ background: 'var(--panel2)', textAlign: 'left' }}>
                    {['Product', 'Category', 'Qty', 'Unit', 'Availability', 'Add Qty', 'Sell / Bill Out', 'Actions'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '12px 16px',
                          fontWeight: 600,
                          color: 'var(--text2)',
                          borderBottom: '1px solid var(--border)',
                          whiteSpace: 'nowrap',
                          textAlign: ['Add Qty', 'Sell / Bill Out', 'Actions'].includes(h) ? 'center' : 'left',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'var(--text3)' }}>
                        {products.length === 0
                          ? 'No products yet. Use the form above to add items.'
                          : 'No products match your search.'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => (
                      <tr
                        key={p.product_id}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          background: searchMatch ? 'rgba(240,180,41,0.04)' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '12px 16px', color: 'var(--white)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.product_name}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.category || '—'}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'var(--gold2)' }}>
                          {Number(p.quantity)}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text2)' }}>{p.unit}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              padding: '4px 10px',
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 600,
                              fontFamily: 'var(--font-mono)',
                              background: inStock(p.quantity)
                                ? 'rgba(16,185,129,0.15)'
                                : 'rgba(244,63,94,0.12)',
                              color: inStock(p.quantity) ? '#34d399' : '#fb7185',
                              border: `1px solid ${inStock(p.quantity) ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.2)'}`,
                            }}
                          >
                            {inStock(p.quantity) ? 'In stock' : 'Out / zero'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 16px' }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={editQty[p.product_id] ?? ''}
                              onChange={(e) => setEditQty((prev) => ({ ...prev, [p.product_id]: e.target.value }))}
                              placeholder="+Qty"
                              style={{ ...inp, width: 74, minWidth: 74, padding: '8px 10px', fontSize: 12 }}
                            />
                            <button
                              type="button"
                              onClick={() => updateQuantity(p)}
                              style={{
                                background: 'rgba(14,165,233,0.14)',
                                border: '1px solid rgba(14,165,233,0.3)',
                                borderRadius: 8,
                                padding: '8px 10px',
                                cursor: 'pointer',
                                color: '#7dd3fc',
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                              title="Add quantity to current stock"
                            >
                              Add
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '8px 16px' }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={saleQty[p.product_id] ?? ''}
                              onChange={(e) => setSaleQty((prev) => ({ ...prev, [p.product_id]: e.target.value }))}
                              placeholder="Qty"
                              style={{ ...inp, width: 74, minWidth: 74, padding: '8px 10px', fontSize: 12 }}
                            />
                            <button
                              type="button"
                              onClick={() => sellProduct(p)}
                              style={{
                                background: 'rgba(16,185,129,0.14)',
                                border: '1px solid rgba(16,185,129,0.25)',
                                borderRadius: 8,
                                padding: '8px 10px',
                                cursor: 'pointer',
                                color: '#34d399',
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                              title="Record sale and reduce stock"
                            >
                              Bill out
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => removeProduct(p.product_id)}
                            style={{
                              background: 'rgba(244,63,94,0.08)',
                              border: '1px solid rgba(244,63,94,0.2)',
                              borderRadius: 8,
                              padding: 8,
                              cursor: 'pointer',
                              color: '#f87171',
                            }}
                            title="Remove"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
