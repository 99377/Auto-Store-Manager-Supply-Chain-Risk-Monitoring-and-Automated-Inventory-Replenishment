
# Auto Store Manager - Supplier Risk + Smart Inventory Auto-Replenishment

Auto Store Manager is a full-stack application for small and medium retail businesses (for example, kirana stores) to:

- monitor supplier risk in near real-time,
- manage in-store inventory,
- integrate billing outputs (manual/API/CSV),
- and automatically place supply orders to the best-price supplier when stock goes below threshold.

---

## What Problem This Solves

In real stores, stock-outs and supplier uncertainty cause lost sales and operational stress.
Auto Store Manager solves this by combining:

1. **Risk intelligence** (news/weather-driven supplier risk signals)
2. **Inventory visibility** (what is currently in stock)
3. **Automated replenishment** (threshold-based ordering)
4. **Supplier optimization** (best-price supplier selection)

This reduces manual tracking, avoids emergency procurement, and improves supply continuity.

---

## Key Features

### A) Authentication & Access
- Register/Login with JWT authentication
- Protected routes for dashboard modules

### B) Supplier Registry
- Add/manage suppliers with location and category
- Store supplier email + phone for real notifications
- Per-supplier:
  - active/inactive status
  - auto-order enable/disable checkbox
  - configurable baseline price fields

### C) Risk Intelligence Pipeline
- Scheduled ingestion/classification/scoring pipeline
- Manual pipeline trigger from UI
- Risk levels (`low`, `medium`, `high`) per supplier
- Alerts generated and listed in Alerts page

### D) My Shop Inventory
- Store profile (shop name/type)
- Store shop address and owner contact details
- Add products with category, quantity, unit
- Search inventory
- Manual bill-out (sale) from product row to decrement stock

### E) Billing Integration (Real-World Friendly)
- External billing machine/API token integration
- Secure machine token generation/regeneration
- Machine sync endpoint:
  - `POST /api/billing/sync/machine` + `X-Machine-Token`
- CSV bill import fallback:
  - `product_name,quantity_sold`
- Manual sync endpoint:
  - `POST /api/billing/sync/manual`

### F) Order Supplies (Auto-Replenishment)
- New navigation section: **Order Supplies**
- Global auto-order ON/OFF switch
- Per-product threshold quantity (default: `10`)
- Auto-order flow:
  1. Detect product below threshold
  2. Create pre-order alert in Alerts
  3. Select best-price eligible supplier
  4. Place supply order record
  5. Create post-order alert in Alerts
- Order history with supplier, qty, price, total, status
- Real-time supplier notification on auto-order:
  - email with shop + order details

### G) Product-Level Supplier Catalog Matching
- Supplier auto-selection now uses **exact product-level catalog**, not category-only mapping
- In Order Supplies:
  - maintain supplier-product-price rows
  - product-name autocomplete from inventory list

### H) Theme System
- Dark/Light theme toggle
- Theme persistence in localStorage
- Light-theme readability fixes for inputs/dropdowns/caret

---

## Tech Stack

### Frontend
- React 19
- Vite 8
- React Router 7
- Axios
- Lucide Icons
- react-hot-toast
- Recharts / Framer Motion (dashboard visuals and UI polish)

### Backend
- FastAPI
- SQLAlchemy ORM
- APScheduler
- JWT auth (`python-jose`)
- bcrypt password hashing
- `requests` for external API ingestion

### ML / NLP
- Hugging Face Transformers
- Zero-shot classification (`facebook/bart-large-mnli`)
- Rule + keyword assisted classification pipeline

### Database
- MySQL 8
- Relational schema + JSON fields for risk evidence

---

## High-Level Project Structure

```text
major project 8th sem/
  backend/
    app/
      main.py
      database.py
      models/
        user.py
        supplier.py
        risk.py
        inventory.py
        order_supply.py
      routes/
        auth.py
        suppliers.py
        risks.py
        inventory.py
        order_supplies.py
      pipeline/
        ingestion.py
        classifier.py
        scorer.py
        scheduler.py
      services/
        order_supplies.py
  frontend/
    src/
      pages/
        Dashboard.jsx
        Suppliers.jsx
        Alerts.jsx
        Inventory.jsx
        OrderSupplies.jsx
      components/
      context/
      api/
  database/
    schema.sql
    migration_add_inventory.sql
```

---

## Database Notes

Important business tables include:

- `users`
- `suppliers`
- `raw_events`, `classified_risks`, `supplier_risk_scores`, `alerts`
- `shop_settings`, `inventory_products`, `billing_integrations`
- `supply_orders`
- `supplier_product_catalog`

---

## Setup & Run (Windows)

### 1) Database
Run in MySQL Workbench:

1. `database/schema.sql` (fresh setup)  
or
2. `database/migration_add_inventory.sql` (existing DB migration)

### 2) Backend
```powershell
cd "d:\major project 8th sem\backend"
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 3) Frontend
```powershell
cd "d:\major project 8th sem\frontend"
npm run dev
```

Open: `http://localhost:5173`

---

## Environment Variables (Backend `.env`)

At minimum:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `SECRET_KEY`
- `ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `NEWSAPI_KEY`
- `OPENWEATHER_KEY`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM_EMAIL`
- `SMTP_USE_TLS`

---

## Core API Groups

- Auth: `/api/auth/*`
- Suppliers: `/api/suppliers/*`
- Risk/Alerts: `/api/risks`, `/api/alerts`
- Inventory & Billing:
  - `/api/inventory/*`
  - `/api/billing/*`
- Order Supplies:
  - `/api/order-supplies/config`
  - `/api/order-supplies/catalog`
  - `/api/order-supplies/thresholds`
  - `/api/order-supplies/process-auto-orders`
  - `/api/order-supplies/orders`

---

## Current Workflow (Business Perspective)

1. Owner maintains suppliers and product catalog prices.
2. Billing updates inventory through API/CSV/manual bill-out.
3. System checks thresholds.
4. If stock is low:
   - alert generated,
   - best supplier selected,
   - order auto-created and logged.
5. Owner sees everything in Alerts + Order Supplies history.

---

## Future Enhancements (Suggested)

- Real supplier-side order acknowledgment workflow
- Purchase-order PDF/WhatsApp/email dispatch
- Product synonym/fuzzy matching (beyond exact names)
- Multi-branch inventory support
- Advanced demand forecasting for reorder quantity

=======
# Auto-Store-Manager-project

