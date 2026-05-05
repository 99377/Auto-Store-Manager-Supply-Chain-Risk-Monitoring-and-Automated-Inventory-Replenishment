import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { ShoppingCart, Save, RefreshCw, BellRing } from 'lucide-react';

const inp = {
  width: '100%',
  padding: '10px 12px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--border2)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text)',
  fontSize: '13px',
  fontFamily: 'var(--font-body)',
  boxSizing: 'border-box',
};

export default function OrderSupplies() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState({ auto_order_enabled: 1, suppliers: [] });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [catalogRows, setCatalogRows] = useState([]);
  const inventoryNameSuggestions = useMemo(
    () => (products || []).map((p) => p.product_name).filter(Boolean),
    [products],
  );

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [c, p, o] = await Promise.all([
        API.get('/api/order-supplies/config'),
        API.get('/api/inventory/products'),
        API.get('/api/order-supplies/orders'),
      ]);
      setCfg(c.data);
      setProducts(p.data);
      setOrders(o.data);
      const cat = await API.get('/api/order-supplies/catalog');
      setCatalogRows(cat.data);
    } catch (e) {
      console.error(e);
      toast.error('Could not load order supplies');
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const saveConfig = async () => {
    setSaving(true);
    try {
      await API.put('/api/order-supplies/config', {
        auto_order_enabled: cfg.auto_order_enabled ? 1 : 0,
        suppliers: cfg.suppliers.map((s) => ({
          supplier_id: s.supplier_id,
          unit_price: Number(s.unit_price || 0),
          auto_order_enabled: s.auto_order_enabled ? 1 : 0,
        })),
      });
      await API.put('/api/order-supplies/thresholds', {
        items: products.map((p) => ({
          product_id: p.product_id,
          threshold_qty: Number(p.threshold_qty || 10),
        })),
      });
      await API.put('/api/order-supplies/catalog', {
        items: catalogRows
          .filter((x) => x.product_name?.trim())
          .map((x) => ({
            supplier_id: Number(x.supplier_id),
            product_name: x.product_name,
            unit_price: Number(x.unit_price || 0),
          })),
      });
      toast.success('Order-supplies settings saved');
      fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Save failed');
    }
    setSaving(false);
  };

  const runAutoOrderCheck = async () => {
    setProcessing(true);
    try {
      const r = await API.post('/api/order-supplies/process-auto-orders');
      toast.success(`Auto-order check done. Orders created: ${r.data.orders_created}`);
      fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Could not process auto orders');
    }
    setProcessing(false);
  };

  return (
    <Layout>
      <div className="animate-fadeUp" style={{ maxWidth: 1150, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, color: 'var(--white)', fontFamily: 'var(--font-head)' }}>Order Supplies</h1>
            <p style={{ margin: '6px 0 0', color: 'var(--text2)', fontSize: 13 }}>
              Auto-order below-threshold stock to best-price eligible supplier.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              onClick={runAutoOrderCheck}
              disabled={processing}
              style={{ border: '1px solid var(--border2)', background: 'var(--panel2)', color: 'var(--text)', borderRadius: 10, padding: '10px 12px', cursor: 'pointer' }}
            >
              <RefreshCw size={14} style={{ display: 'inline-block', marginRight: 6 }} />
              {processing ? 'Checking…' : 'Run Auto-order Check'}
            </button>
            <button
              type="button"
              onClick={saveConfig}
              disabled={saving}
              style={{ border: '1px solid rgba(240,180,41,0.35)', background: 'rgba(240,180,41,0.12)', color: 'var(--gold2)', borderRadius: 10, padding: '10px 12px', cursor: 'pointer' }}
            >
              <Save size={14} style={{ display: 'inline-block', marginRight: 6 }} />
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: 18, marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)' }}>
            <input
              type="checkbox"
              checked={!!cfg.auto_order_enabled}
              onChange={(e) => setCfg((x) => ({ ...x, auto_order_enabled: e.target.checked ? 1 : 0 }))}
            />
            <span style={{ fontWeight: 600 }}>Enable automatic ordering globally</span>
          </label>
          <p style={{ color: 'var(--text3)', fontSize: 12, margin: '8px 0 0' }}>
            When ON, any product below threshold triggers alert + auto order to best-price eligible supplier.
          </p>
        </div>

        <div className="card" style={{ padding: 0, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text2)' }}>
            SUPPLIER FLAGS
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--panel2)', textAlign: 'left' }}>
                  {['Supplier', 'Category', 'Auto order for this supplier'].map((h) => (
                    <th key={h} style={{ padding: '10px 14px', color: 'var(--text2)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(cfg.suppliers || []).map((s) => (
                  <tr key={s.supplier_id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px', color: 'var(--white)' }}>{s.supplier_name}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text2)' }}>{s.product_category || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={!!s.auto_order_enabled}
                          onChange={(e) => {
                            setCfg((x) => ({
                              ...x,
                              suppliers: x.suppliers.map((z) => z.supplier_id === s.supplier_id ? { ...z, auto_order_enabled: e.target.checked ? 1 : 0 } : z),
                            }));
                          }}
                        />
                        Enabled
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ padding: 0, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text2)' }}>
            SUPPLIER PRODUCT CATALOG (EXACT MATCH PRICES)
          </div>
          <div style={{ padding: 12 }}>
            <button
              type="button"
              onClick={() => setCatalogRows((rows) => [...rows, { supplier_id: cfg.suppliers?.[0]?.supplier_id || 0, product_name: '', unit_price: 0 }])}
              style={{ border: '1px solid var(--border2)', background: 'var(--panel2)', color: 'var(--text)', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', marginBottom: 10 }}
            >
              + Add catalog row
            </button>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--panel2)', textAlign: 'left' }}>
                    {['Supplier', 'Product Name (must match inventory)', 'Unit Price', ''].map((h) => (
                      <th key={h} style={{ padding: '10px 14px', color: 'var(--text2)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {catalogRows.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: 16, color: 'var(--text3)', textAlign: 'center' }}>No catalog rows yet.</td></tr>
                  ) : catalogRows.map((row, idx) => (
                    <tr key={`${row.catalog_id || 'new'}-${idx}`} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 14px', width: 220 }}>
                        <select
                          style={inp}
                          value={row.supplier_id}
                          onChange={(e) => setCatalogRows((rows) => rows.map((r, i) => i === idx ? { ...r, supplier_id: Number(e.target.value) } : r))}
                        >
                          {(cfg.suppliers || []).map((s) => (
                            <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <input
                          list={`inventory-products-${idx}`}
                          style={inp}
                          value={row.product_name || ''}
                          onChange={(e) => setCatalogRows((rows) => rows.map((r, i) => i === idx ? { ...r, product_name: e.target.value } : r))}
                          placeholder="e.g. Tata Salt 1kg"
                        />
                        <datalist id={`inventory-products-${idx}`}>
                          {inventoryNameSuggestions.map((name) => (
                            <option key={`${idx}-${name}`} value={name} />
                          ))}
                        </datalist>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                          Tip: choose an existing inventory product name for exact auto-order matching.
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', width: 160 }}>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          style={inp}
                          value={row.unit_price ?? 0}
                          onChange={(e) => setCatalogRows((rows) => rows.map((r, i) => i === idx ? { ...r, unit_price: e.target.value } : r))}
                        />
                      </td>
                      <td style={{ padding: '10px 14px', width: 80 }}>
                        <button
                          type="button"
                          onClick={() => setCatalogRows((rows) => rows.filter((_, i) => i !== idx))}
                          style={{ border: '1px solid rgba(244,63,94,0.2)', background: 'rgba(244,63,94,0.08)', color: '#f87171', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 0, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text2)' }}>
            PRODUCT THRESHOLDS (DEFAULT 10)
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--panel2)', textAlign: 'left' }}>
                  {['Product', 'Category', 'Current Qty', 'Threshold Qty'].map((h) => (
                    <th key={h} style={{ padding: '10px 14px', color: 'var(--text2)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.product_id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px', color: 'var(--white)' }}>{p.product_name}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text2)' }}>{p.category || '—'}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--gold2)' }}>{Number(p.quantity)}</td>
                    <td style={{ padding: '10px 14px', width: 170 }}>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        style={inp}
                        value={p.threshold_qty ?? 10}
                        onChange={(e) => {
                          const v = e.target.value;
                          setProducts((arr) => arr.map((x) => x.product_id === p.product_id ? { ...x, threshold_qty: v } : x));
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text2)' }}>
            ORDER HISTORY
          </div>
          {loading ? (
            <div style={{ padding: 20, color: 'var(--text3)' }}>Loading…</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--panel2)', textAlign: 'left' }}>
                    {['Time', 'Product', 'Supplier', 'Qty', 'Price', 'Total', 'Type', 'Status'].map((h) => (
                      <th key={h} style={{ padding: '10px 14px', color: 'var(--text2)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: 20, textAlign: 'center', color: 'var(--text3)' }}>No orders yet.</td></tr>
                  ) : orders.map((o) => (
                    <tr key={o.order_id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 14px', color: 'var(--text3)', whiteSpace: 'nowrap' }}>{new Date(o.created_at).toLocaleString()}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--white)' }}>{o.product_name}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text2)' }}>{o.supplier_name}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--gold2)' }}>{o.quantity_ordered} {o.unit}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text2)' }}>{o.unit_price}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text2)' }}>{o.total_price}</td>
                      <td style={{ padding: '10px 14px' }}>
                        {o.auto_created ? <span style={{ color: '#34d399' }}><BellRing size={13} style={{ marginRight: 5 }} />Auto</span> : <span style={{ color: 'var(--text2)' }}><ShoppingCart size={13} style={{ marginRight: 5 }} />Manual</span>}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text2)' }}>{o.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
