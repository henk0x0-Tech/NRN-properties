# 🏰 NRN Properties — Luxury Real Estate Web Portal & CPanel

> **Ultra-Luxury 360° Floor Plate Virtual Tours, Node.js Backend REST API, Flat-File JSON DBMS & Google Analytics 4 (GA4) Integration**  
> Specially tailored for Electronic City Phase 1 & Phase 2, Bangalore.

---

## 📸 Overview & Key Highlights

NRN Properties is a full-stack luxury real estate platform enabling high-net-worth investors and buyers to remotely inspect sky mansions, penthouses, and gated floor plates in high definition 360° virtual reality.

- **🌐 Frontend**: Vanilla HTML5, CSS3 Glassmorphism, Three.js 360° Spherical Panoramic Engine.
- **🔐 Admin CPanel (`/admin`)**: Standalone, modular admin dashboard to edit properties, hero content, contact numbers, stats, and view CRM leads.
- **🗄️ Flat-File JSON DBMS (`data.json`)**: Zero database configuration required; persists changes automatically with historical rollbacks in `.backups/`.
- **🚀 Node.js Backend (`server.js`)**: RESTful API server with endpoints for properties, inquiries, newsletter subscribers, and telemetry.
- **📊 Google Analytics 4 (GA4)**: Dynamic tracking with custom conversion events (`generate_lead`, `view_item`, `sign_up`, `contact_whatsapp`).

---

## 📁 Repository Structure

```text
NRN-properties/
├── 📄 index.html          # Main luxury real estate portal with 360° VR viewer
├── 🎨 style.css           # Premium obsidian & champagne gold styling
├── ⚡ app.js              # Client-side 360 viewer, Three.js engine & GA4 tracking
├── 🗄️ data.json           # Central database containing properties, leads, settings
├── 🚀 server.js           # Node.js backend server with RESTful API & static delivery
├── ⚙️ package.json        # Node.js scripts and package dependencies
├── 📜 server.ps1          # Lightweight Windows PowerShell local server fallback
├── 🚫 .gitignore          # Git ignore rules for node_modules, backups, logs
│
└── 📁 admin/              # 🔐 Admin Control Panel (Standalone Directory)
    ├── 📄 index.html      # CPanel user interface (Dashboard, CRM, Settings)
    ├── 🎨 admin.css       # Obsidian dark theme CPanel styling
    └── ⚡ admin.js        # CPanel logic, REST API sync, CSV exporter & JSON editor
```

---

## 🚀 Quick Start: Clone & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/henk0x0-Tech/NRN-properties.git
cd NRN-properties
```

### 2. Run with Node.js (Recommended)
Make sure [Node.js](https://nodejs.org/) (version 16+) is installed on your system.

```bash
# Optional: Install Express & dependencies
npm install

# Start the Node.js server
npm start
```
The server will start at:
- **Main Portal**: `http://localhost:1234/`
- **Admin CPanel**: `http://localhost:1234/admin/`
- **API Endpoint**: `http://localhost:1234/api/data`

---

### 3. Alternative: Running Without Node.js (PowerShell)
If you are on Windows and do not have Node.js installed, you can start the built-in PowerShell server:

```powershell
powershell -ExecutionPolicy Bypass -File .\server.ps1 -port 1234
```
Or simply double-click `index.html` to open in any web browser!

---

## 🔐 Admin Control Panel Details

| Setting | Default Value |
|---|---|
| **Admin URL** | `http://localhost:1234/admin/` (or `admin/index.html`) |
| **Username** | `admin` |
| **Password** | `nrn2026@admin` |

### CPanel Modules
1. **🏠 Properties Management**: Add, update, or remove luxury residences, floor plates, prices, and 360° panoramic rooms.
2. **🎯 Site Settings**: Edit hero headlines, contact phone, WhatsApp number, and office addresses.
3. **📊 Google Analytics (GA4)**: Set your Google Analytics Measurement ID (`G-XXXXXXXXXX`) and toggle auto-tracked events.
4. **👥 CRM & Inquiries**: View all private tour requests, VIP consultation leads, and export to CSV.
5. **📧 Investor Gazette**: Access newsletter subscribers and download contact lists.
6. **🗄️ Database (JSON)**: Live raw JSON editor for bulk updates with automatic syntax validation.

---

## ⚡ REST API Reference (`server.js`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server health check and uptime stats |
| `GET` | `/api/data` | Fetch entire database JSON (`data.json`) |
| `POST` | `/api/data` | Overwrite database with automatic backup |
| `GET` | `/api/properties` | List all available luxury residences |
| `POST` | `/api/properties` | Add or update a property listing |
| `DELETE` | `/api/properties/:id` | Remove a property by ID |
| `GET` | `/api/leads` | Retrieve contact inquiries |
| `POST` | `/api/leads` | Submit a private viewing request |
| `GET` | `/api/subscribers` | Get newsletter subscribers |
| `POST` | `/api/subscribers` | Add new subscriber |
| `GET` | `/api/settings` | Retrieve site & Google Analytics configuration |
| `POST` | `/api/settings` | Update site & Google Analytics configuration |
| `POST` | `/api/analytics/track` | Server-side telemetry event logger |

---

## 📊 Google Analytics 4 Setup

1. Open the **Admin CPanel** at `http://localhost:1234/admin/`.
2. Navigate to **Site Settings** in the left sidebar.
3. Locate the **Google Analytics 4 (GA4)** card.
4. Paste your **Measurement ID** (e.g. `G-XXXXXXXXXX`).
5. Click **Save Settings**.
6. All visitor interactions, 360° floor plate tours, and lead submissions will automatically stream into your Google Analytics dashboard.

---

## 🛡️ License & Credits
© 2026 **NRN Properties Bangalore**. All Rights Reserved.
RERA Karnataka & BBMP Registered.
