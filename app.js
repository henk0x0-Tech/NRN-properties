// NRN Luxury Real Estate - Bangalore, Electronic City Edition
// CMS-powered: content loaded from data.json / localStorage via Admin CPanel

// ── Node.js & CMS Loader ──────────────────────────────────
const CMS_KEY = 'nrn_cms_data';

async function loadCMSData() {
  // 1. Try fetching from active Node.js API backend first
  try {
    const res = await fetch('/api/data?_=' + Date.now());
    if (res.ok) {
      const data = await res.json();
      if (data && data.residences) {
        localStorage.setItem(CMS_KEY, JSON.stringify(data));
        // Configure GA dynamically if available
        if (data.analytics && data.analytics.googleAnalyticsId && data.analytics.googleAnalyticsId !== 'G-XXXXXXXXXX') {
          localStorage.setItem('NRN_GA_ID', data.analytics.googleAnalyticsId);
        }
        return data;
      }
    }
  } catch (apiErr) {
    // API not yet reachable or running static, proceed to localStorage/fallback
  }

  // 2. Try localStorage cache
  const local = localStorage.getItem(CMS_KEY);
  if (local) {
    try { 
      const parsed = JSON.parse(local);
      if (parsed && parsed.residences) return parsed;
    } catch(e) {}
  }

  // 3. Fallback to static data.json file
  try {
    const res = await fetch('data.json?_=' + Date.now());
    const data = await res.json();
    return data;
  } catch(e) {
    console.warn('Could not load data.json, using default in-memory data.', e);
    return null;
  }
}

async function saveCMSData(data) {
  data._meta = data._meta || {};
  data._meta.lastUpdated = new Date().toISOString();
  localStorage.setItem(CMS_KEY, JSON.stringify(data));

  // Sync with Node.js backend if online
  try {
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch(e) {
    // offline or local only
  }
}

// ── Global CMS state ─────────────────────────────────────
let CMS_DB = null;

// 1. Curated Residences Dataset - Bangalore (Electronic City Phase 1 & Phase 2)
const RESIDENCES_DATA = [
  {
    id: "obsidian-sky-ec1",
    title: "The Obsidian Sky Villa",
    location: "Electronic City Phase 1, Bangalore",
    locationKey: "ec-phase1",
    landmark: "Near Wipro Corporate Campus / Neeladri Road",
    type: "sky-mansion",
    priceInr: 68500000,
    priceFormatted: "₹6.85 Cr",
    badge: "Signature Collection",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    specs: {
      beds: "5 BHK Triplex",
      baths: "6 Baths",
      sqft: "6,800 sq.ft",
      tier: "tier-2"
    },
    plates: ["Floor 22 - Sky Villa Plate A", "Floor 23 - Duplex Terrace Plate", "Floor 24 - Penthouse Crown Plate"],
    rooms: [
      { id: "living", name: "Grand Living Salon", panorama: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=2000&q=85", desc: "Double-height salon with Botticino marble & floor-to-ceiling glass" },
      { id: "master", name: "Master Presidential Suite", panorama: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=2000&q=85", desc: "Panoramic view over Phase 1 tech corridor with walk-in wardrobe" },
      { id: "terrace", name: "Sky Terrace & Infinity Pool", panorama: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=2000&q=85", desc: "Cantilevered infinity plunge pool floating 24 floors up" },
      { id: "kitchen", name: "Modular Italian Kitchen", panorama: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=2000&q=85", desc: "Custom Poliform cabinetry with integrated Miele appliances" }
    ],
    description: "Ultra-luxury cantilevered triplex sky villa floating high above the Phase 1 tech skyline with private infinity terrace pool & biometric foyer."
  },
  {
    id: "elysium-villa-ec2",
    title: "Villa Elysium Grandeur",
    location: "Electronic City Phase 2, Bangalore",
    locationKey: "ec-phase2",
    landmark: "Near Tech Mahindra & TCS Hub",
    type: "gated-villa",
    priceInr: 48000000,
    priceFormatted: "₹4.80 Cr",
    badge: "Gated Estate",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
    specs: {
      beds: "4 BHK Luxury Villa",
      baths: "5 Baths",
      sqft: "4,950 sq.ft",
      tier: "tier-2"
    },
    plates: ["Ground Plate - Garden & Courtyard", "First Floor - Family Lounge Plate", "Terrace Plate - Rooftop Solar Deck"],
    rooms: [
      { id: "living", name: "Double-Height Courtyard", panorama: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=85", desc: "Open-to-sky central courtyard with vertical green wall" },
      { id: "master", name: "Master Royal Suite", panorama: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=2000&q=85", desc: "Hardwood oak flooring with private balcony overlooking garden" },
      { id: "terrace", name: "Private Zen Garden", panorama: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=2000&q=85", desc: "Landscaped private lawn with gazebo and outdoor barbecue" }
    ],
    description: "Private landscaped villa with double-height Italian marble living spaces, zen courtyard, and dual EV charging ports in Phase 2's quietest avenue."
  },
  {
    id: "belgravia-penthouse-ec1",
    title: "The Neo-Belgravia Penthouse",
    location: "Electronic City Phase 1, Bangalore",
    locationKey: "ec-phase1",
    landmark: "Overlooking Hosur Elevated Expressway",
    type: "penthouse",
    priceInr: 35000000,
    priceFormatted: "₹3.50 Cr",
    badge: "Crown Penthouse",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    specs: {
      beds: "4 BHK Duplex",
      baths: "4.5 Baths",
      sqft: "4,200 sq.ft",
      tier: "tier-1"
    },
    plates: ["Lower Level Plate - Grand Living", "Upper Level Plate - Master Suites"],
    rooms: [
      { id: "living", name: "Sky Lounge & Salon", panorama: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=2000&q=85", desc: "Acoustically insulated double-pane glass with skyline panorama" },
      { id: "master", name: "Executive Suite", panorama: "https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?auto=format&fit=crop&w=2000&q=85", desc: "Bespoke brass paneling and ensuite marble spa bathroom" }
    ],
    description: "Duplex penthouse with wrap-around champagne louvers, triple-pane acoustic soundproofing, and private sky lounge."
  },
  {
    id: "sovereign-crown-ec1",
    title: "Sovereign Crown Sky Palace",
    location: "Electronic City Phase 1, Bangalore",
    locationKey: "ec-phase1",
    landmark: "Prime Neeladri Tech Corridor",
    type: "sky-mansion",
    priceInr: 115000000,
    priceFormatted: "₹11.50 Cr",
    badge: "Off-Market Crown",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
    specs: {
      beds: "6 BHK Sky Mansion",
      baths: "7 Baths",
      sqft: "9,500 sq.ft",
      tier: "tier-3"
    },
    plates: ["Top Floor Plate - 360 Observatory", "Duplex Lower Plate - Royal Foyer"],
    rooms: [
      { id: "living", name: "360° Crown Observatory", panorama: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2000&q=85", desc: "Unobstructed views from Hosur border to Koramangala horizon" },
      { id: "master", name: "Emperor Suite & Spa", panorama: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=2000&q=85", desc: "Jacuzzi spa, Finnish sauna, and private safe sanctuary" }
    ],
    description: "Rare full-floor sky mansion spanning the top two penthouse floors with 360° observatory views of Bangalore's IT Silicon belt."
  },
  {
    id: "silicon-meridian-ec2",
    title: "The Silicon Meridian Residences",
    location: "Electronic City Phase 2, Bangalore",
    locationKey: "ec-phase2",
    landmark: "Near Infosys Gate & Tech Park Corridor",
    type: "penthouse",
    priceInr: 24500000,
    priceFormatted: "₹2.45 Cr",
    badge: "Prime Executive",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
    specs: {
      beds: "3 BHK Luxury Penthouse",
      baths: "3 Baths",
      sqft: "2,750 sq.ft",
      tier: "tier-1"
    },
    plates: ["Floor 15 - Meridian Plate A", "Floor 15 - Meridian Plate B"],
    rooms: [
      { id: "living", name: "Contemporary Living", panorama: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=2000&q=85", desc: "Open layout with smart lighting and seamless balcony integration" },
      { id: "master", name: "Master Bedroom Suite", panorama: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=2000&q=85", desc: "Quiet courtyard facing orientation with acoustic damping" }
    ],
    description: "Premium designer residence crafted with obsidian dark accents, German smart home automation, and quick walkability to top IT campuses."
  },
  {
    id: "serene-palms-ec2",
    title: "The Serene Palms Garden Estate",
    location: "Electronic City Phase 2, Bangalore",
    locationKey: "ec-phase2",
    landmark: "Bettadasanapura Road Green Belt",
    type: "gated-villa",
    priceInr: 52500000,
    priceFormatted: "₹5.25 Cr",
    badge: "Private Sanctuary",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    specs: {
      beds: "5 BHK Luxury Villa",
      baths: "6 Baths",
      sqft: "5,600 sq.ft",
      tier: "tier-2"
    },
    plates: ["Plate A - Ground Living & Pool", "Plate B - Upper Suites & Lounge"],
    rooms: [
      { id: "living", name: "Estate Grand Foyer", panorama: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=85", desc: "Sprawling living room overlooking heated private pool" },
      { id: "terrace", name: "Lakeside Deck & Lawn", panorama: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=2000&q=85", desc: "Private green sanctuary surrounded by 100-year-old banyan trees" }
    ],
    description: "Tranquil private garden estate featuring a private temperature-controlled lap pool, personal gymnasium, and 100% solar micro-grid."
  }
];

// State
let currentCategory = 'all';
let currentBuildingMode = 'wireframe';
let currentLightingMode = 'night';

// 360 Tour State
let vrScene, vrCamera, vrRenderer, vrSphere, vrAnimId;
let isVrUserInteracting = false;
let onVrPointerDownMouseX = 0, onVrPointerDownMouseY = 0;
let vrLon = 0, onVrPointerDownLon = 0;
let vrLat = 0, onVrPointerDownLat = 0;
let vrPhi = 0, vrTheta = 0;
let isAutoRotateVr = true;
let currentProperty360 = null;
let currentRoom360Index = 0;

// DOM Loaded Initialization — CMS-powered
document.addEventListener("DOMContentLoaded", async () => {
  // Load CMS data first
  CMS_DB = await loadCMSData();

  // Merge CMS residences into RESIDENCES_DATA if available
  if (CMS_DB && CMS_DB.residences && CMS_DB.residences.length > 0) {
    // Replace default data with CMS data
    RESIDENCES_DATA.length = 0;
    CMS_DB.residences.forEach(r => RESIDENCES_DATA.push(r));
  } else if (CMS_DB) {
    // If CMS exists but no residences, keep defaults; save them to CMS
    CMS_DB.residences = [...RESIDENCES_DATA];
    saveCMSData(CMS_DB);
  }

  // Apply hero/site settings from CMS
  if (CMS_DB && CMS_DB.site) {
    applySiteSettings(CMS_DB.site);
  }

  // Apply stats from CMS
  if (CMS_DB && CMS_DB.stats) {
    applyStatsSettings(CMS_DB.stats);
  }

  renderResidences(RESIDENCES_DATA);
  initNavbarScroll();
  initThreeJsViewer();
  updateCalculator();
});

// Apply CMS site settings to DOM
function applySiteSettings(site) {
  // Brand name
  document.querySelectorAll('.brand-name').forEach(el => {
    const span = el.querySelector('span');
    el.childNodes[0].textContent = site.brandName || 'NRN PROPERTIES';
    if (span && site.tagline) span.textContent = site.tagline;
  });

  // Hero
  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle && site.heroTitle) {
    heroTitle.innerHTML = site.heroTitle.replace('360°', '<span class="text-gold-gradient">360°</span>');
  }
  const heroSubtitle = document.querySelector('.hero-subtitle');
  if (heroSubtitle && site.heroSubtitle) heroSubtitle.textContent = site.heroSubtitle;

  const eyebrow = document.querySelector('.badge-pill.pulse');
  if (eyebrow && site.heroEyebrow) eyebrow.textContent = site.heroEyebrow;

  const eyebrowSub = document.querySelector('.label-caps');
  if (eyebrowSub && site.heroEyebrowSub) eyebrowSub.textContent = site.heroEyebrowSub;

  // WhatsApp links
  if (site.whatsappNumber) {
    document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
      const href = a.getAttribute('href');
      a.setAttribute('href', href.replace(/wa\.me\/\d+/, 'wa.me/' + site.whatsappNumber));
    });
  }

  // Footer
  const footerBottom = document.querySelector('.footer-bottom div');
  if (footerBottom && site.footerCopyright) footerBottom.textContent = site.footerCopyright;

  const reraEl = document.querySelector('.footer-brand .badge-pill');
  if (reraEl && site.reraText) reraEl.textContent = site.reraText;
}

// Apply CMS stats to DOM
function applyStatsSettings(stats) {
  const items = document.querySelectorAll('.telemetry-item');
  stats.forEach((s, i) => {
    if (!items[i]) return;
    const valEl = items[i].querySelector('.telemetry-value');
    const lblEl = items[i].querySelector('.telemetry-label');
    if (valEl && s.value) {
      valEl.innerHTML = s.value + (s.unit ? `<span>${s.unit}</span>` : '');
    }
    if (lblEl && s.label) lblEl.textContent = s.label;
  });
}

// 2. Render Residences with 360° Tour Button
function renderResidences(data) {
  const container = document.getElementById("residence-grid");
  if (!container) return;

  if (data.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
        <p style="font-size: 1.25rem;">No residences matched your specific Electronic City filter criteria.</p>
        <button class="btn-ghost" style="margin-top: 1rem;" onclick="filterCategory('all')">Reset All Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = data.map(item => `
    <article class="residence-card">
      <div class="card-media">
        <img src="${item.image}" alt="${item.title}" loading="lazy">
        <div class="card-badge-top">
          <span class="badge-pill">${item.badge}</span>
        </div>
        <div class="card-price-overlay">
          <div class="card-price data-tabular">${item.priceFormatted}</div>
          <span class="label-caps" style="color: var(--secondary-gold);">Verified Title</span>
        </div>
      </div>
      
      <div class="card-content">
        <div class="card-location">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--secondary-gold)">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          ${item.location}
        </div>
        <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: -6px;">${item.landmark}</div>
        
        <h3 class="card-title">${item.title}</h3>
        <p style="color: var(--text-muted); font-size: 0.875rem; line-height: 1.5;">${item.description}</p>
        
        <div class="spec-grid">
          <div class="spec-item">
            <span class="spec-val">${item.specs.beds}</span>
            <span class="spec-lbl">Layout</span>
          </div>
          <div class="spec-item">
            <span class="spec-val">${item.specs.baths}</span>
            <span class="spec-lbl">Baths</span>
          </div>
          <div class="spec-item">
            <span class="spec-val">${item.specs.sqft}</span>
            <span class="spec-lbl">Super Built-Up</span>
          </div>
        </div>

        <!-- 360 Virtual Tour Button for Every Flat/Plate -->
        <button class="btn-360-tour" onclick="open360Tour('${item.id}')">
          <svg viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
          </svg>
          Explore 360° Online Plate View
        </button>

        <div class="card-footer-actions">
          <button class="btn-gold" onclick="openConciergeModal('${item.title} - ${item.location}')">Download Dossier</button>
          <button class="btn-ghost" onclick="openConciergeModal('Site Visit: ${item.title}')">Schedule Site Visit</button>
        </div>
      </div>
    </article>
  `).join("");
}

// 3. Category & Hero Filters
function filterCategory(cat, btn) {
  currentCategory = cat;
  
  if (btn) {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  }

  if (cat === 'all') {
    renderResidences(RESIDENCES_DATA);
  } else if (cat === 'ec-phase1') {
    const filtered = RESIDENCES_DATA.filter(r => r.locationKey === 'ec-phase1');
    renderResidences(filtered);
  } else if (cat === 'ec-phase2') {
    const filtered = RESIDENCES_DATA.filter(r => r.locationKey === 'ec-phase2');
    renderResidences(filtered);
  } else if (cat === 'off-market') {
    const filtered = RESIDENCES_DATA.filter(r => r.badge.includes('Off-Market') || r.badge.includes('Signature'));
    renderResidences(filtered);
  } else {
    const filtered = RESIDENCES_DATA.filter(r => r.type === cat);
    renderResidences(filtered);
  }
}

function applyHeroFilters() {
  const loc = document.getElementById("filter-location").value;
  const type = document.getElementById("filter-type").value;
  const price = document.getElementById("filter-price").value;

  let filtered = RESIDENCES_DATA;

  if (loc !== 'all') {
    filtered = filtered.filter(r => r.locationKey === loc);
  }
  if (type !== 'all') {
    filtered = filtered.filter(r => r.type === type);
  }
  if (price !== 'all') {
    filtered = filtered.filter(r => r.specs.tier === price);
  }

  renderResidences(filtered);
  document.getElementById("residences").scrollIntoView({ behavior: "smooth" });
}

// 4. Navbar Interactive Navigation & ScrollSpy Engine
function initNavbarScroll() {
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll("header[id], section[id]");

  // Click Navigation Handler with Offset
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href");
      if (targetId && targetId.startsWith("#")) {
        e.preventDefault();
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
          const navHeight = 80;
          const targetPos = targetSection.getBoundingClientRect().top + window.pageYOffset - navHeight;
          
          window.scrollTo({
            top: targetPos,
            behavior: "smooth"
          });

          // Immediate Active Class Update
          navLinks.forEach(l => l.classList.remove("active"));
          link.classList.add("active");

          // Close mobile menu if open
          const mobileNav = document.getElementById("nav-links");
          if (mobileNav) mobileNav.classList.remove("mobile-open");
        }
      }
    });
  });

  // ScrollSpy with Intersection / Scroll Position
  window.addEventListener("scroll", () => {
    let currentSectionId = "";
    const scrollPos = window.scrollY + 120;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        currentSectionId = section.getAttribute("id");
      }
    });

    if (currentSectionId) {
      navLinks.forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${currentSectionId}`) {
          link.classList.add("active");
        }
      });
    }
  });
}

// Mobile Menu Toggle
function toggleMobileNav() {
  const navList = document.getElementById("nav-links");
  if (navList) {
    navList.classList.toggle("mobile-open");
  }
}

// 5. Realistic 29-Floor 3D Skyscraper Architectural Visualizer (Three.js)
let scene, camera, renderer, towerGroup, animId;
let towerMaterials = {};
let floorHitBoxes = [];
let highlightRing;
let elevatorCab;
let spireBeacon;
let raycaster, mouse;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let cameraTarget = { x: 0, y: 15, z: 0 };
let currentTargetY = 15;
let currentCameraRadius = 45;
let currentCameraTheta = 0.8;
let currentCameraPhi = 0.45;
let autoRotateSpeed = 0.002;
let hoveredFloorLevel = 29;

// 29 Full Floors Data (Electronic City Phase 1 Signature Tower)
const TOWER_FLOORS = [
  { level: 1, name: "Grand Obsidian Lobby & Triple-Height Atrium", elevation: "+0m", type: "Podium Grand Lobby", price: "Amenities & Concierge", specs: "12,000 sq.ft · Private Valet, Art Gallery & Cafe" },
  { level: 2, name: "Private Residents Club & Cigar Lounge", elevation: "+4m", type: "Podium Club Level", price: "Residents Exclusive", specs: "Sommelier Wine Vault, Business Boardrooms" },
  { level: 3, name: "Wellness Spa, Squash Court & Heated Lap Pool", elevation: "+8m", type: "Podium Wellness Level", price: "Residents Exclusive", specs: "Hydrotherapy Suites, Technogym Fitness Floor" },
  { level: 4, name: "Executive Suite 401-404", elevation: "+12m", type: "3BHK Executive Residence", price: "₹3.85 Cr", specs: "2,650 sq.ft · Neeladri Road Skyline View" },
  { level: 5, name: "Executive Suite 501-504", elevation: "+16m", type: "3BHK Executive Residence", price: "₹3.95 Cr", specs: "2,650 sq.ft · East Wing Private Balconies" },
  { level: 6, name: "Executive Suite 601-604", elevation: "+20m", type: "3BHK Executive Residence", price: "₹4.05 Cr", specs: "2,700 sq.ft · Acoustic Glazed Facade" },
  { level: 7, name: "Executive Suite 701-704 with Terrace", elevation: "+24m", type: "3BHK Sky Suite", price: "₹4.20 Cr", specs: "2,850 sq.ft · Cantilevered Corner Deck" },
  { level: 8, name: "Executive Suite 801-804", elevation: "+28m", type: "3BHK Executive Residence", price: "₹4.30 Cr", specs: "2,700 sq.ft · Double Glazed Curtain Wall" },
  { level: 9, name: "Executive Suite 901-904", elevation: "+32m", type: "3BHK Executive Residence", price: "₹4.40 Cr", specs: "2,700 sq.ft · Elevated Tollway Skyline" },
  { level: 10, name: "High-Rise Suite 1001-1004", elevation: "+36m", type: "3BHK High-Rise Suite", price: "₹4.55 Cr", specs: "2,750 sq.ft · High-Speed Lift Landing" },
  { level: 11, name: "High-Rise Suite 1101-1104", elevation: "+40m", type: "3BHK High-Rise Suite", price: "₹4.65 Cr", specs: "2,750 sq.ft · Panoramic Glass Bay" },
  { level: 12, name: "High-Rise Suite 1201-1204", elevation: "+44m", type: "3BHK High-Rise Suite", price: "₹4.75 Cr", specs: "2,800 sq.ft · Italian Marble Foyer" },
  { level: 13, name: "High-Rise Suite 1301-1304", elevation: "+48m", type: "3BHK High-Rise Suite", price: "₹4.85 Cr", specs: "2,800 sq.ft · Sunset Facing Loggia" },
  { level: 14, name: "Sky Suite 1401-1404 with Green Deck", elevation: "+52m", type: "3BHK Sky Suite", price: "₹4.98 Cr", specs: "2,950 sq.ft · Landscaped Planter Balcony" },
  { level: 15, name: "Imperial Sky Residence 1501-1502", elevation: "+56m", type: "4BHK Imperial Residence", price: "₹5.90 Cr", specs: "3,850 sq.ft · Private Elevator Vestibule" },
  { level: 16, name: "Imperial Sky Residence 1601-1602", elevation: "+60m", type: "4BHK Imperial Residence", price: "₹6.15 Cr", specs: "3,850 sq.ft · 10.5ft Clear Ceiling Height" },
  { level: 17, name: "Imperial Sky Residence 1701-1702", elevation: "+64m", type: "4BHK Imperial Residence", price: "₹6.40 Cr", specs: "3,900 sq.ft · Wrap-around Glazed Balcony" },
  { level: 18, name: "Imperial Sky Residence 1801-1802 with Sky Solarium", elevation: "+68m", type: "4BHK Imperial Sky Suite", price: "₹6.75 Cr", specs: "4,100 sq.ft · Double-Height Glass Solarium" },
  { level: 19, name: "Imperial Sky Residence 1901-1902", elevation: "+72m", type: "4BHK Imperial Residence", price: "₹7.05 Cr", specs: "3,900 sq.ft · Smart Automation Fitted" },
  { level: 20, name: "Imperial Sky Residence 2001-2002", elevation: "+76m", type: "4BHK Imperial Residence", price: "₹7.35 Cr", specs: "3,950 sq.ft · German Engineered Kitchen" },
  { level: 21, name: "Imperial Sky Residence 2101-2102", elevation: "+80m", type: "4BHK Imperial Residence", price: "₹7.70 Cr", specs: "4,000 sq.ft · 270° Unobstructed View" },
  { level: 22, name: "Imperial Sky Suite 2201-2202 with Terrace", elevation: "+84m", type: "4BHK Imperial Sky Suite", price: "₹8.10 Cr", specs: "4,250 sq.ft · Deep Cantilever Sky Deck" },
  { level: 23, name: "Imperial Sky Residence 2301-2302", elevation: "+88m", type: "4BHK Imperial Residence", price: "₹8.50 Cr", specs: "4,000 sq.ft · Master Dressing Walk-in" },
  { level: 24, name: "Imperial Sky Residence 2401-2402", elevation: "+92m", type: "4BHK Imperial Residence", price: "₹8.95 Cr", specs: "4,100 sq.ft · Highest Mid-Tier Level" },
  { level: 25, name: "Grand Sky Mansion 2501 (Whole Floor)", elevation: "+96m", type: "5BHK Ultra Sky Mansion", price: "₹12.20 Cr", specs: "5,400 sq.ft · 360° Private Floor Plate" },
  { level: 26, name: "Grand Sky Mansion 2601 (Whole Floor)", elevation: "+100m", type: "5BHK Ultra Sky Mansion", price: "₹13.10 Cr", specs: "5,400 sq.ft · Private Plunge Pool & Jacuzzi" },
  { level: 27, name: "Grand Sky Mansion 2701 (Whole Floor)", elevation: "+104m", type: "5BHK Ultra Sky Mansion", price: "₹14.20 Cr", specs: "5,600 sq.ft · Triple Balconies & Wine Cellar" },
  { level: 28, name: "Presidential Duplex Villa (Lower Salon)", elevation: "+108m", type: "Duplex Penthouse Lower", price: "₹18.50 Cr", specs: "6,800 sq.ft · 24ft Italian Botticino Grand Salon" },
  { level: 29, name: "Presidential Sky Villa Penthouse & Helipad Deck", elevation: "+116m", type: "Sky Penthouse & Helipad", price: "₹18.50 Cr", specs: "Private Infinity Pool, Rooftop Helipad & Observatory" }
];

// Procedural Realistic High-Rise Facade Texture
function createTowerFacadeTexture(theme = 'obsidian') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Background Glass Tint
  if (theme === 'obsidian') {
    ctx.fillStyle = '#0b101d';
    ctx.fillRect(0, 0, 1024, 1024);
  } else if (theme === 'champagne') {
    ctx.fillStyle = '#1c170d';
    ctx.fillRect(0, 0, 1024, 1024);
  }

  // Draw 8 columns x 8 rows of window panes
  const cols = 8;
  const rows = 8;
  const colW = 1024 / cols;
  const rowH = 1024 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * colW;
      const y = r * rowH;
      const pad = 6;

      // Realistic illuminated room or dark reflective glass
      const isLit = (c + r * 3) % 3 !== 0;
      const isWarm = (c + r) % 2 === 0;

      if (isLit) {
        // Luxury room ambient interior glow
        const grad = ctx.createLinearGradient(x, y, x, y + rowH);
        if (theme === 'obsidian') {
          grad.addColorStop(0, isWarm ? '#fae29c' : '#fcedc7');
          grad.addColorStop(0.3, isWarm ? '#e5be65' : '#eed690');
          grad.addColorStop(1, '#66491a');
        } else {
          grad.addColorStop(0, '#fff4cc');
          grad.addColorStop(0.3, '#f3c666');
          grad.addColorStop(1, '#8c5e15');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(x + pad, y + pad, colW - pad * 2, rowH - pad * 2);

        // Blinds / sheer curtains detail
        ctx.fillStyle = 'rgba(10, 13, 20, 0.25)';
        for (let b = 0; b < 3; b++) {
          ctx.fillRect(x + pad, y + pad + b * 18, colW - pad * 2, 6);
        }

        // Downlight glow dot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + colW / 2, y + pad + 10, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Reflective dark tinted pane
        const darkGrad = ctx.createLinearGradient(x, y, x + colW, y + rowH);
        darkGrad.addColorStop(0, '#101626');
        darkGrad.addColorStop(0.5, '#1e293b');
        darkGrad.addColorStop(1, '#090d16');
        ctx.fillStyle = darkGrad;
        ctx.fillRect(x + pad, y + pad, colW - pad * 2, rowH - pad * 2);
      }

      // Bronze/Gold mullion borders
      ctx.strokeStyle = theme === 'champagne' ? '#ebc166' : '#9e7b2f';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + pad, y + pad, colW - pad * 2, rowH - pad * 2);
    }
  }

  // Vertical Architectural Mullion accent lines
  ctx.fillStyle = theme === 'champagne' ? '#f5d78e' : '#c9a24b';
  for (let c = 0; c <= cols; c++) {
    ctx.fillRect(c * colW - 2, 0, 4, 1024);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Procedural Helipad Texture
function createHelipadTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Concrete dark pad base
  ctx.fillStyle = '#1e2330';
  ctx.beginPath();
  ctx.arc(256, 256, 240, 0, Math.PI * 2);
  ctx.fill();

  // Outer safety circle
  ctx.strokeStyle = '#c9a24b';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(256, 256, 220, 0, Math.PI * 2);
  ctx.stroke();

  // Inner yellow target ring
  ctx.strokeStyle = '#ebc166';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(256, 256, 170, 0, Math.PI * 2);
  ctx.stroke();

  // Large White 'H' in center
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 160px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('H', 256, 256);

  // Runway Orientation Arrows
  ctx.fillStyle = '#ebc166';
  ctx.font = 'bold 24px JetBrains Mono, monospace';
  ctx.fillText('NRN · EC1 HELIPORT', 256, 75);
  ctx.fillText('MAX 12T · FL 29', 256, 440);

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

function initThreeJsViewer() {
  const container = document.getElementById("residence-3d-canvas");
  if (!container || typeof THREE === "undefined") return;

  const width = container.clientWidth || 600;
  const height = container.clientHeight || 540;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
  
  // Set initial dramatic camera position framing the 29-floor tower
  updateCameraPosition();

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.innerHTML = "";
  container.appendChild(renderer.domElement);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Textures
  const obsidianGlassTex = createTowerFacadeTexture('obsidian');
  const champagneGlassTex = createTowerFacadeTexture('champagne');
  const helipadTex = createHelipadTexture();

  // Materials
  towerMaterials.obsidianGlass = new THREE.MeshStandardMaterial({
    map: obsidianGlassTex,
    roughness: 0.15,
    metalness: 0.85,
    bumpScale: 0.05
  });

  towerMaterials.champagneGlass = new THREE.MeshStandardMaterial({
    map: champagneGlassTex,
    roughness: 0.15,
    metalness: 0.9,
    bumpScale: 0.05
  });

  towerMaterials.goldSlab = new THREE.MeshStandardMaterial({
    color: 0xc9a24b,
    roughness: 0.25,
    metalness: 0.85
  });

  towerMaterials.obsidianSlab = new THREE.MeshStandardMaterial({
    color: 0x141a29,
    roughness: 0.35,
    metalness: 0.6
  });

  towerMaterials.balconyGlass = new THREE.MeshPhysicalMaterial({
    color: 0xe2c275,
    transparent: true,
    opacity: 0.45,
    roughness: 0.1,
    metalness: 0.2
  });

  towerMaterials.poolWater = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    roughness: 0.1,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85
  });

  towerMaterials.helipad = new THREE.MeshStandardMaterial({
    map: helipadTex,
    roughness: 0.4,
    metalness: 0.2
  });

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffeedd, 1.4);
  sunLight.position.set(35, 60, 40);
  scene.add(sunLight);

  const goldRimLight = new THREE.PointLight(0xc9a24b, 2.2, 80);
  goldRimLight.position.set(-25, 30, -25);
  scene.add(goldRimLight);

  const cityBaseLight = new THREE.PointLight(0x38bdf8, 1.5, 40);
  cityBaseLight.position.set(20, 5, 20);
  scene.add(cityBaseLight);

  // Tower Geometry Group
  towerGroup = new THREE.Group();
  floorHitBoxes = [];

  // Ground Plaza & Water Feature
  const groundGeo = new THREE.CylinderGeometry(20, 22, 1, 40);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x0c101c, roughness: 0.5, metalness: 0.4 });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.position.y = -0.5;
  towerGroup.add(groundMesh);

  // Plaza Gold Perimeter Ring
  const plazaRingGeo = new THREE.TorusGeometry(19.8, 0.15, 16, 60);
  const plazaRingMesh = new THREE.Mesh(plazaRingGeo, towerMaterials.goldSlab);
  plazaRingMesh.rotation.x = Math.PI / 2;
  plazaRingMesh.position.y = 0.05;
  towerGroup.add(plazaRingMesh);

  // Entrance Water Fountain
  const fountainGeo = new THREE.CylinderGeometry(3.5, 3.8, 0.4, 30);
  const fountainMesh = new THREE.Mesh(fountainGeo, towerMaterials.poolWater);
  fountainMesh.position.set(0, 0.2, 12);
  towerGroup.add(fountainMesh);

  // Build All 29 Distinct Floors
  const totalFloors = 29;
  let currentY = 0;

  for (let i = 0; i < totalFloors; i++) {
    const floorNumber = i + 1;
    const floorData = TOWER_FLOORS[i];

    // Determine tier scale and height
    let floorHeight = 0.95;
    let floorWidth = 10.5;
    
    if (floorNumber <= 3) {
      // Podium Triple-Height Lobby (Floors 1-3)
      floorHeight = 1.25;
      floorWidth = 13.0;
    } else if (floorNumber <= 14) {
      // Executive High-Rise (Floors 4-14)
      floorHeight = 0.95;
      floorWidth = 11.0;
    } else if (floorNumber <= 24) {
      // Imperial Suites (Floors 15-24)
      floorHeight = 1.0;
      floorWidth = 9.8 - (floorNumber - 15) * 0.08;
    } else if (floorNumber <= 27) {
      // Sky Mansions (Floors 25-27)
      floorHeight = 1.1;
      floorWidth = 8.6;
    } else {
      // Presidential Duplex Penthouse (Floors 28-29)
      floorHeight = 1.35;
      floorWidth = 7.6;
    }

    const floorY = currentY + floorHeight / 2;
    const floorSubGroup = new THREE.Group();
    floorSubGroup.position.y = floorY;

    // 1. Concrete / Obsidian Floor Slab (Bottom of floor)
    const slabGeo = new THREE.BoxGeometry(floorWidth + 0.5, 0.15, floorWidth + 0.5);
    const slabMesh = new THREE.Mesh(slabGeo, towerMaterials.obsidianSlab);
    slabMesh.position.y = -floorHeight / 2 + 0.075;
    floorSubGroup.add(slabMesh);

    // Gold Bevel Edge Line
    const edgeGeo = new THREE.BoxGeometry(floorWidth + 0.55, 0.04, floorWidth + 0.55);
    const edgeMesh = new THREE.Mesh(edgeGeo, towerMaterials.goldSlab);
    edgeMesh.position.y = -floorHeight / 2 + 0.075;
    floorSubGroup.add(edgeMesh);

    // 2. Glass Curtain Wall Body
    const glassGeo = new THREE.BoxGeometry(floorWidth, floorHeight - 0.15, floorWidth);
    const glassMesh = new THREE.Mesh(glassGeo, towerMaterials.obsidianGlass);
    glassMesh.userData = { isGlassBody: true, floorNumber: floorNumber };
    floorSubGroup.add(glassMesh);

    // 3. Architectural CAD Edges (for CAD Mode)
    const edges = new THREE.EdgesGeometry(glassGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xebc166, transparent: true, opacity: 0.7 });
    const wireframeLines = new THREE.LineSegments(edges, lineMat);
    wireframeLines.visible = false;
    wireframeLines.userData = { isWireframeLine: true };
    floorSubGroup.add(wireframeLines);

    // 4. Balconies & Cantilever Terraces for Luxury Floors
    if ([4, 7, 10, 14, 18, 22, 25, 26, 27, 28, 29].includes(floorNumber)) {
      const balconyWidth = floorWidth * 0.45;
      const balconyDepth = 1.2;
      const balconyGeo = new THREE.BoxGeometry(balconyWidth, 0.1, balconyDepth);
      const balconyMesh = new THREE.Mesh(balconyGeo, towerMaterials.obsidianSlab);
      balconyMesh.position.set(floorWidth / 2 - balconyWidth / 2, -floorHeight / 2 + 0.1, floorWidth / 2 + balconyDepth / 2);
      floorSubGroup.add(balconyMesh);

      // Glass Balustrade
      const railGeo = new THREE.BoxGeometry(balconyWidth, 0.35, 0.05);
      const railMesh = new THREE.Mesh(railGeo, towerMaterials.balconyGlass);
      railMesh.position.set(floorWidth / 2 - balconyWidth / 2, -floorHeight / 2 + 0.3, floorWidth / 2 + balconyDepth);
      floorSubGroup.add(railMesh);
    }

    // 5. Special Ground Grand Lobby Portico (Floor 1)
    if (floorNumber === 1) {
      const porticoCanopy = new THREE.BoxGeometry(8, 0.25, 4.5);
      const porticoMesh = new THREE.Mesh(porticoCanopy, towerMaterials.goldSlab);
      porticoMesh.position.set(0, 0.3, 7.8);
      floorSubGroup.add(porticoMesh);

      // Colonnade Pillars
      const pillarGeo = new THREE.CylinderGeometry(0.18, 0.18, floorHeight, 16);
      const pillar1 = new THREE.Mesh(pillarGeo, towerMaterials.goldSlab);
      pillar1.position.set(-3.5, 0, 9.5);
      const pillar2 = new THREE.Mesh(pillarGeo, towerMaterials.goldSlab);
      pillar2.position.set(3.5, 0, 9.5);
      floorSubGroup.add(pillar1);
      floorSubGroup.add(pillar2);
    }

    // 6. Interactive Raycast Hit Box
    const hitBoxGeo = new THREE.BoxGeometry(floorWidth + 1.8, floorHeight, floorWidth + 1.8);
    const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitBoxMesh = new THREE.Mesh(hitBoxGeo, hitBoxMat);
    hitBoxMesh.userData = { floorNumber: floorNumber, floorData: floorData, floorY: floorY };
    floorSubGroup.add(hitBoxMesh);
    floorHitBoxes.push(hitBoxMesh);

    towerGroup.add(floorSubGroup);
    currentY += floorHeight;
  }

  const towerTopY = currentY;

  // Rooftop (Floor 29 Crown, Helipad, Pool, Spire)
  // Rooftop Teak Sun Deck
  const roofDeckGeo = new THREE.BoxGeometry(7.8, 0.2, 7.8);
  const roofDeckMesh = new THREE.Mesh(roofDeckGeo, towerMaterials.obsidianSlab);
  roofDeckMesh.position.y = towerTopY + 0.1;
  towerGroup.add(roofDeckMesh);

  // Rooftop Glass Balustrade
  const roofRailGeo = new THREE.BoxGeometry(7.8, 0.5, 7.8);
  const roofRailMesh = new THREE.Mesh(roofRailGeo, towerMaterials.balconyGlass);
  roofRailMesh.position.y = towerTopY + 0.45;
  towerGroup.add(roofRailMesh);

  // Private Heated Infinity Pool on Floor 29
  const poolGeo = new THREE.BoxGeometry(3.5, 0.15, 2.5);
  const poolMesh = new THREE.Mesh(poolGeo, towerMaterials.poolWater);
  poolMesh.position.set(1.6, towerTopY + 0.25, -1.8);
  towerGroup.add(poolMesh);

  // Raised Circular Helipad on Rooftop
  const heliPadGeo = new THREE.CylinderGeometry(2.4, 2.5, 0.2, 32);
  const heliPadMesh = new THREE.Mesh(heliPadGeo, towerMaterials.helipad);
  heliPadMesh.position.set(-1.2, towerTopY + 0.3, 1.2);
  towerGroup.add(heliPadMesh);

  // Architectural Gold Crown Finial & Spire (+125m)
  const crownGeo = new THREE.ConeGeometry(1.6, 4.5, 6);
  const crownMesh = new THREE.Mesh(crownGeo, towerMaterials.goldSlab);
  crownMesh.position.y = towerTopY + 2.4;
  towerGroup.add(crownMesh);

  const spireGeo = new THREE.CylinderGeometry(0.08, 0.25, 4.0, 16);
  const spireMesh = new THREE.Mesh(spireGeo, towerMaterials.goldSlab);
  spireMesh.position.y = towerTopY + 5.5;
  towerGroup.add(spireMesh);

  // FAA Aviation Strobe Beacon on Spire Tip
  const beaconGeo = new THREE.SphereGeometry(0.2, 16, 16);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
  spireBeacon = new THREE.Mesh(beaconGeo, beaconMat);
  spireBeacon.position.y = towerTopY + 7.5;
  towerGroup.add(spireBeacon);

  // Panoramic Glass Elevator Core
  const elevatorTrackGeo = new THREE.BoxGeometry(1.2, towerTopY, 1.2);
  const elevatorTrackMesh = new THREE.Mesh(elevatorTrackGeo, towerMaterials.balconyGlass);
  elevatorTrackMesh.position.set(-5.6, towerTopY / 2, -5.6);
  towerGroup.add(elevatorTrackMesh);

  const cabGeo = new THREE.BoxGeometry(1.0, 0.9, 1.0);
  const cabMat = new THREE.MeshStandardMaterial({ color: 0xebc166, roughness: 0.2, metalness: 0.9 });
  elevatorCab = new THREE.Mesh(cabGeo, cabMat);
  elevatorCab.position.set(-5.6, 2, -5.6);
  towerGroup.add(elevatorCab);

  // Laser Floor Highlight Scan Ring
  const ringGeo = new THREE.BoxGeometry(11.8, 0.25, 11.8);
  const ringEdges = new THREE.EdgesGeometry(ringGeo);
  const ringMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
  highlightRing = new THREE.LineSegments(ringEdges, ringMat);
  highlightRing.position.y = towerTopY - 0.7; // Start at Floor 29
  towerGroup.add(highlightRing);

  // Ambient Golden City Particles
  const particleGeo = new THREE.BufferGeometry();
  const particleCount = 240;
  const posArray = new Float32Array(particleCount * 3);
  for (let p = 0; p < particleCount * 3; p += 3) {
    posArray[p] = (Math.random() - 0.5) * 60;
    posArray[p + 1] = Math.random() * (towerTopY + 15);
    posArray[p + 2] = (Math.random() - 0.5) * 60;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  const particleMat = new THREE.PointsMaterial({ size: 0.18, color: 0xc9a24b, transparent: true, opacity: 0.7 });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  scene.add(towerGroup);

  // Setup Mouse Drag & Orbit Interaction
  setupTowerInteraction(container);

  // Initial Floor Inspection Display
  updateFloorInspector(29);

  // Window Resize
  window.addEventListener("resize", () => {
    if (!container) return;
    const newW = container.clientWidth;
    const newH = container.clientHeight;
    camera.aspect = newW / newH;
    camera.updateProjectionMatrix();
    renderer.setSize(newW, newH);
  });

  // Animation Loop
  let elevatorDir = 1;
  let elevatorY = 2;
  let beaconTimer = 0;

  function animate() {
    animId = requestAnimationFrame(animate);

    // Auto Slow Rotate when not dragging
    if (!isDragging) {
      currentCameraTheta += autoRotateSpeed;
      updateCameraPosition();
    }

    // Elevator Animation
    elevatorY += 0.08 * elevatorDir;
    if (elevatorY >= towerTopY - 1.5) elevatorDir = -1;
    if (elevatorY <= 1.5) elevatorDir = 1;
    elevatorCab.position.y = elevatorY;

    // Beacon Flashing
    beaconTimer += 0.05;
    spireBeacon.material.color.setHex(Math.sin(beaconTimer * 4) > 0 ? 0xff0033 : 0x440000);

    // Floating Particles
    particles.rotation.y += 0.0004;

    renderer.render(scene, camera);
  }
  animate();
}

function updateCameraPosition() {
  const x = cameraTarget.x + currentCameraRadius * Math.sin(currentCameraTheta) * Math.cos(currentCameraPhi);
  const y = currentTargetY + currentCameraRadius * Math.sin(currentCameraPhi);
  const z = cameraTarget.z + currentCameraRadius * Math.cos(currentCameraTheta) * Math.cos(currentCameraPhi);
  camera.position.set(x, y, z);
  camera.lookAt(cameraTarget.x, currentTargetY, cameraTarget.z);
}

// Interactive Mouse & Touch Drag Controls
function setupTowerInteraction(container) {
  const canvasEl = renderer.domElement;

  canvasEl.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  window.addEventListener('mousemove', (e) => {
    const rect = canvasEl.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Orbit Rotation Drag
    if (isDragging) {
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      currentCameraTheta -= deltaX * 0.008;
      currentCameraPhi = Math.max(-0.2, Math.min(1.2, currentCameraPhi + deltaY * 0.008));

      updateCameraPosition();
      previousMousePosition = { x: e.clientX, y: e.clientY };
    }

    // Raycast Floor Hover Detection
    if (mouseX >= 0 && mouseX <= rect.width && mouseY >= 0 && mouseY <= rect.height) {
      mouse.x = (mouseX / rect.width) * 2 - 1;
      mouse.y = -(mouseY / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(floorHitBoxes, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const lvl = hit.userData.floorNumber;
        if (lvl && lvl !== hoveredFloorLevel) {
          hoveredFloorLevel = lvl;
          updateFloorInspector(lvl);
          if (highlightRing) {
            highlightRing.position.y = hit.userData.floorY;
            const scale = (lvl <= 3) ? 1.25 : (lvl <= 14 ? 1.05 : (lvl <= 24 ? 0.95 : (lvl <= 27 ? 0.85 : 0.75)));
            highlightRing.scale.set(scale, 1, scale);
          }
        }
      }
    }
  });

  // Zoom with Wheel
  canvasEl.addEventListener('wheel', (e) => {
    e.preventDefault();
    currentCameraRadius = Math.max(22, Math.min(65, currentCameraRadius + e.deltaY * 0.04));
    updateCameraPosition();
  }, { passive: false });

  // Click on floor to focus
  canvasEl.addEventListener('click', (e) => {
    const rect = canvasEl.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(floorHitBoxes, false);
    if (intersects.length > 0) {
      const hit = intersects[0].object;
      jumpToTowerFloor(hit.userData.floorNumber);
    }
  });

  // Touch Support for Mobile
  let touchStart = { x: 0, y: 0 };
  canvasEl.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, { passive: true });

  canvasEl.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - touchStart.x;
      const deltaY = e.touches[0].clientY - touchStart.y;
      currentCameraTheta -= deltaX * 0.01;
      currentCameraPhi = Math.max(-0.2, Math.min(1.2, currentCameraPhi + deltaY * 0.01));
      updateCameraPosition();
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, { passive: true });

  canvasEl.addEventListener('touchend', () => {
    isDragging = false;
  });
}

// Update Floor Inspector Overlay Card & Top HUD
function updateFloorInspector(level) {
  const floor = TOWER_FLOORS.find(f => f.level === level) || TOWER_FLOORS[28];
  
  const hudTag = document.getElementById("hud-floor-tag");
  if (hudTag) {
    hudTag.textContent = `FLOOR ${floor.level} · ${floor.type.toUpperCase()} (${floor.elevation})`;
  }

  const ficLevel = document.getElementById("fic-level");
  const ficElev = document.getElementById("fic-elevation");
  const ficTitle = document.getElementById("fic-title");
  const ficSpecs = document.getElementById("fic-specs");
  const ficPrice = document.getElementById("fic-price");

  if (ficLevel) ficLevel.textContent = `FL ${floor.level}`;
  if (ficElev) ficElev.textContent = `${floor.elevation} Elevation`;
  if (ficTitle) ficTitle.textContent = floor.name;
  if (ficSpecs) ficSpecs.textContent = floor.specs;
  if (ficPrice) ficPrice.textContent = floor.price;
}

// Jump Camera Focus to Any of the 29 Floors
function jumpToTowerFloor(level, btn) {
  hoveredFloorLevel = level;
  if (btn) {
    document.querySelectorAll(".jumper-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  }

  const targetFloor = TOWER_FLOORS.find(f => f.level === level) || TOWER_FLOORS[28];
  updateFloorInspector(level);

  // Find target floor Y
  const hit = floorHitBoxes.find(h => h.userData.floorNumber === level);
  if (hit) {
    currentTargetY = hit.userData.floorY;
    if (highlightRing) {
      highlightRing.position.y = hit.userData.floorY;
      const scale = (level <= 3) ? 1.25 : (level <= 14 ? 1.05 : (level <= 24 ? 0.95 : (level <= 27 ? 0.85 : 0.75)));
      highlightRing.scale.set(scale, 1, scale);
    }
  }

  if (level === 29) {
    currentCameraRadius = 32;
    currentCameraPhi = 0.55;
  } else if (level === 1) {
    currentCameraRadius = 28;
    currentCameraPhi = 0.2;
  } else {
    currentCameraRadius = 30;
    currentCameraPhi = 0.35;
  }

  updateCameraPosition();
}

function resetTowerCamera(btn) {
  if (btn) {
    document.querySelectorAll(".jumper-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  }
  currentTargetY = 15;
  currentCameraRadius = 45;
  currentCameraPhi = 0.45;
  currentCameraTheta = 0.8;
  updateCameraPosition();
  jumpToTowerFloor(29);
}

function setBuildingMode(mode, btn) {
  if (btn) {
    btn.parentElement.querySelectorAll(".control-pill-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  }

  if (!towerGroup) return;

  towerGroup.traverse((child) => {
    if (child.userData && child.userData.isGlassBody) {
      if (mode === 'obsidian') {
        child.material = towerMaterials.obsidianGlass;
        child.visible = true;
      } else if (mode === 'champagne') {
        child.material = towerMaterials.champagneGlass;
        child.visible = true;
      } else if (mode === 'wireframe') {
        child.visible = false;
      }
    }
    if (child.userData && child.userData.isWireframeLine) {
      child.visible = (mode === 'wireframe');
    }
  });
}

function toggleLightingMode(lighting, btn) {
  if (btn) {
    btn.parentElement.querySelectorAll(".control-pill-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  }

  if (lighting === 'sunset') {
    scene.background = new THREE.Color(0x1f1008);
    const sunColor = new THREE.Color(0xffaa55);
    scene.traverse((child) => {
      if (child.isDirectionalLight) {
        child.color.set(sunColor);
        child.intensity = 1.8;
      }
    });
  } else {
    scene.background = null;
    scene.traverse((child) => {
      if (child.isDirectionalLight) {
        child.color.setHex(0xffeedd);
        child.intensity = 1.4;
      }
    });
  }
}

// 6. Valuation & Investment Appreciation Calculator (Indian Rupees - Lakhs & Crores)
function updateCalculator() {
  const priceInput = document.getElementById("input-price");
  const downInput = document.getElementById("input-down");
  const growthInput = document.getElementById("input-growth");

  if (!priceInput || !downInput || !growthInput) return;

  const priceInr = parseFloat(priceInput.value);
  const downPct = parseFloat(downInput.value) / 100;
  const growthRate = parseFloat(growthInput.value) / 100;

  // Labels in Indian Currency Format
  document.getElementById("slider-val-price").textContent = formatInrCrores(priceInr);
  document.getElementById("slider-val-down").textContent = `${downInput.value}% (${formatInrCrores(priceInr * downPct)})`;
  document.getElementById("slider-val-growth").textContent = `${growthInput.value}% Annual Tech Corridor ROI`;

  // 5-Year Compound Growth
  const futureValue = priceInr * Math.pow(1 + growthRate, 5);
  const gain = futureValue - priceInr;

  document.getElementById("calc-future-val").textContent = formatInrCrores(futureValue);
  document.getElementById("calc-gain-val").textContent = `+${formatInrCrores(gain)}`;
}

// Indian Currency Formatter (Crores & Lakhs)
function formatInrCrores(amount) {
  const crores = amount / 10000000;
  if (crores >= 1) {
    return `₹${crores.toFixed(2)} Cr`;
  }
  const lakhs = amount / 100000;
  return `₹${lakhs.toFixed(2)} Lakhs`;
}

// 7. VIP Concierge Modal
function openConciergeModal(interestTitle = "Electronic City Site Visit") {
  const modal = document.getElementById("concierge-modal");
  const inputInterest = document.getElementById("client-interests");
  const modalTitle = document.getElementById("modal-title");

  if (modal) {
    if (inputInterest) inputInterest.value = interestTitle;
    if (modalTitle) modalTitle.textContent = `Private Inquiry: ${interestTitle}`;
    modal.classList.add("active");
  }
}

function closeConciergeModal() {
  const modal = document.getElementById("concierge-modal");
  if (modal) modal.classList.remove("active");
}

function handleConciergeSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("client-name").value.trim();
  const email = document.getElementById("client-email").value.trim();
  const phone = document.getElementById("client-phone").value.trim();
  const locationPref = document.getElementById("client-location-pref").value;
  const inquiry = document.getElementById("client-interests").value.trim();
  const notes = document.getElementById("client-notes").value.trim();

  const leadPayload = {
    name, email, phone, locationPref, inquiry, notes,
    residence: inquiry,
    location: locationPref,
    date: new Date().toISOString()
  };

  // 1. Google Analytics 4 Conversion Event Tracking
  if (typeof window.NRN_TRACK_EVENT === "function") {
    window.NRN_TRACK_EVENT("generate_lead", {
      event_category: "Leads",
      event_label: inquiry,
      property_name: inquiry,
      location_preference: locationPref,
      value: 1
    });
  }

  // 2. Send directly to Node.js REST API
  fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(leadPayload)
  }).catch(() => {});

  // 3. Save lead to CMS local cache
  if (CMS_DB) {
    CMS_DB.leads = CMS_DB.leads || [];
    CMS_DB.leads.unshift(leadPayload);
    saveCMSData(CMS_DB);
  }

  alert(`Dhanyavaad, ${name}! Your site visit & private consultation request for Electronic City has been sent to our Senior Portfolio Manager. We will contact you on ${email} shortly.`);
  closeConciergeModal();
  e.target.reset();
}

// 8. 360° Virtual Tour & Online Floor Plate Viewer Engine (Three.js Spherical Panorama)
function open360Tour(propertyId = "obsidian-sky-ec1", roomIndex = 0) {
  const property = RESIDENCES_DATA.find(r => r.id === propertyId) || RESIDENCES_DATA[0];
  currentProperty360 = property;
  currentRoom360Index = roomIndex;

  // Google Analytics 360 Tour Engagement Tracking
  if (typeof window.NRN_TRACK_EVENT === "function") {
    window.NRN_TRACK_EVENT("view_item", {
      event_category: "Virtual Tour",
      item_id: property.id,
      item_name: property.title,
      item_category: property.type,
      price: property.priceInr,
      currency: "INR"
    });
  }

  const modal = document.getElementById("vr-modal");
  if (!modal) return;

  // Set Title & Details
  document.getElementById("vr-property-title").textContent = property.title;
  document.getElementById("vr-property-loc").textContent = `${property.location} · ${property.priceFormatted}`;

  // Render Floor Plate Pills
  const plateContainer = document.getElementById("vr-plates-list");
  if (plateContainer && property.plates) {
    plateContainer.innerHTML = property.plates.map((plate, idx) => `
      <button class="plate-pill-btn ${idx === 0 ? 'active' : ''}" onclick="selectPlate(this, '${plate}')">${plate}</button>
    `).join("");
  }

  // Render Room Buttons
  const roomNav = document.getElementById("vr-room-nav");
  if (roomNav && property.rooms) {
    roomNav.innerHTML = property.rooms.map((room, idx) => `
      <button class="vr-room-btn ${idx === roomIndex ? 'active' : ''}" onclick="switch360Room(${idx})">
        <span>✦</span> ${room.name}
      </button>
    `).join("");
  }

  modal.classList.add("active");

  // Initialize or Update 360 Three.js Canvas
  setTimeout(() => {
    init360PanoramaScene(property.rooms[roomIndex].panorama);
  }, 100);
}

function close360Tour() {
  const modal = document.getElementById("vr-modal");
  if (modal) modal.classList.remove("active");
  if (vrAnimId) cancelAnimationFrame(vrAnimId);
}

function selectPlate(btn, plateName) {
  document.querySelectorAll(".plate-pill-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("vr-plate-badge").textContent = plateName;
}

function switch360Room(index) {
  if (!currentProperty360 || !currentProperty360.rooms[index]) return;
  currentRoom360Index = index;

  document.querySelectorAll(".vr-room-btn").forEach((b, idx) => {
    b.classList.toggle("active", idx === index);
  });

  const room = currentProperty360.rooms[index];
  document.getElementById("vr-room-desc").textContent = room.desc;
  load360Texture(room.panorama);
}

function init360PanoramaScene(imageSrc) {
  const container = document.getElementById("vr-canvas-360");
  if (!container || typeof THREE === "undefined") return;

  container.innerHTML = "";

  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  vrScene = new THREE.Scene();
  vrCamera = new THREE.PerspectiveCamera(75, width / height, 1, 1100);
  vrCamera.target = new THREE.Vector3(0, 0, 0);

  vrRenderer = new THREE.WebGLRenderer({ antialias: true });
  vrRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  vrRenderer.setSize(width, height);
  container.appendChild(vrRenderer.domElement);

  // Sphere Geometry for 360 mapping (Inverted normals)
  const geometry = new THREE.SphereGeometry(500, 60, 40);
  geometry.scale(-1, 1, 1);

  const textureLoader = new THREE.TextureLoader();
  textureLoader.crossOrigin = "anonymous";
  const texture = textureLoader.load(imageSrc, () => {
    vrRenderer.render(vrScene, vrCamera);
  });

  const material = new THREE.MeshBasicMaterial({ map: texture });
  vrSphere = new THREE.Mesh(geometry, material);
  vrScene.add(vrSphere);

  // User Interaction Listeners (Drag to Pan 360)
  const dom = container;
  dom.addEventListener('pointerdown', onVrPointerDown);
  dom.addEventListener('wheel', onVrWheel);
  window.addEventListener('pointermove', onVrPointerMove);
  window.addEventListener('pointerup', onVrPointerUp);

  window.addEventListener('resize', () => {
    if (!container || !vrCamera || !vrRenderer) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    vrCamera.aspect = w / h;
    vrCamera.updateProjectionMatrix();
    vrRenderer.setSize(w, h);
  });

  function animateVr() {
    vrAnimId = requestAnimationFrame(animateVr);

    if (isAutoRotateVr && !isVrUserInteracting) {
      vrLon += 0.08;
    }

    vrLat = Math.max(-85, Math.min(85, vrLat));
    vrPhi = THREE.MathUtils.degToRad(90 - vrLat);
    vrTheta = THREE.MathUtils.degToRad(vrLon);

    const targetX = 500 * Math.sin(vrPhi) * Math.cos(vrTheta);
    const targetY = 500 * Math.cos(vrPhi);
    const targetZ = 500 * Math.sin(vrPhi) * Math.sin(vrTheta);

    vrCamera.lookAt(targetX, targetY, targetZ);
    vrRenderer.render(vrScene, vrCamera);

    // Update Mini-map Radar Angle
    const radar = document.getElementById("radar-indicator");
    if (radar) {
      radar.style.transform = `rotate(${vrLon}deg)`;
    }
  }
  animateVr();
}

function load360Texture(imageSrc) {
  if (!vrSphere) return;
  const textureLoader = new THREE.TextureLoader();
  textureLoader.crossOrigin = "anonymous";
  textureLoader.load(imageSrc, (newTex) => {
    vrSphere.material.map = newTex;
    vrSphere.material.needsUpdate = true;
  });
}

function onVrPointerDown(event) {
  isVrUserInteracting = true;
  onVrPointerDownMouseX = event.clientX;
  onVrPointerDownMouseY = event.clientY;
  onVrPointerDownLon = vrLon;
  onVrPointerDownLat = vrLat;
}

function onVrPointerMove(event) {
  if (!isVrUserInteracting) return;
  vrLon = (onVrPointerDownMouseX - event.clientX) * 0.15 + onVrPointerDownLon;
  vrLat = (event.clientY - onVrPointerDownMouseY) * 0.15 + onVrPointerDownLat;
}

function onVrPointerUp() {
  isVrUserInteracting = false;
}

function onVrWheel(event) {
  if (!vrCamera) return;
  const fov = vrCamera.fov + event.deltaY * 0.05;
  vrCamera.fov = THREE.MathUtils.clamp(fov, 30, 90);
  vrCamera.updateProjectionMatrix();
}

function toggle360AutoRotate(btn) {
  isAutoRotateVr = !isAutoRotateVr;
  if (btn) btn.classList.toggle("active", isAutoRotateVr);
}

function toggle360Fullscreen() {
  const elem = document.getElementById("vr-modal");
  if (!document.fullscreenElement) {
    if (elem.requestFullscreen) elem.requestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
  }
}

// 9. AI Luxury Concierge Chatbot (Bangalore & Electronic City Specific)
function toggleAIConcierge() {
  const panel = document.getElementById("concierge-panel");
  if (panel) panel.classList.toggle("active");
}

function sendChatMessage(e) {
  e.preventDefault();
  const input = document.getElementById("chat-input");
  const container = document.getElementById("chat-msgs");
  if (!input || !input.value.trim() || !container) return;

  const query = input.value.trim();
  
  // Append User Msg
  const userDiv = document.createElement("div");
  userDiv.className = "chat-msg user";
  userDiv.textContent = query;
  container.appendChild(userDiv);
  input.value = "";
  container.scrollTop = container.scrollHeight;

  // Bot Smart Response
  setTimeout(() => {
    const botDiv = document.createElement("div");
    botDiv.className = "chat-msg bot";
    botDiv.innerHTML = generateBangaloreBotResponse(query);
    container.appendChild(botDiv);
    container.scrollTop = container.scrollHeight;
  }, 500);
}

function generateBangaloreBotResponse(text) {
  const lower = text.toLowerCase();
  if (lower.includes("360") || lower.includes("plate") || lower.includes("tour") || lower.includes("online")) {
    return "Every single flat and floor plate in our portfolio features an <strong>interactive 360° Online Tour</strong>. Click the <em>'Explore 360° Online Plate View'</em> button on any property card to virtually inspect the living salons, master suites, and sky pools right from your screen!";
  }
  if (lower.includes("phase 1") || lower.includes("phase1") || lower.includes("neeladri") || lower.includes("wipro")) {
    return "In <strong>Electronic City Phase 1</strong>, we offer the landmark <em>The Obsidian Sky Villa</em> (₹6.85 Cr) and <em>The Neo-Belgravia Penthouse</em> (₹3.50 Cr) with swift connectivity to Neeladri Road and the Elevated Tollway.";
  }
  if (lower.includes("phase 2") || lower.includes("phase2") || lower.includes("tcs") || lower.includes("tech mahindra")) {
    return "In <strong>Electronic City Phase 2</strong>, our exclusive listings include <em>Villa Elysium Grandeur</em> (₹4.80 Cr) and <em>The Silicon Meridian Residences</em> (₹2.45 Cr) near major IT corridors and Tech Mahindra campus.";
  }
  if (lower.includes("price") || lower.includes("cost") || lower.includes("budget") || lower.includes("cr") || lower.includes("lakh")) {
    return "Our curated luxury inventory in Electronic City spans from ₹2.45 Cr for executive penthouses up to ₹11.50 Cr for sovereign crown sky mansions. All titles are BBMP/BMRDA verified.";
  }
  if (lower.includes("whatsapp") || lower.includes("chat") || lower.includes("phone")) {
    return "You can connect with us directly on WhatsApp at <a href='https://wa.me/919880000000' target='_blank' style='color:#25d366; font-weight:600;'>+91 98800 00000</a> for immediate assistance and brochure dispatch.";
  }
  return "NRN Properties specializes exclusively in high-end luxury residences in Electronic City Phase 1 & Phase 2, Bangalore. Every flat has a full 360° virtual tour ready for online exploration!";
}

// 10. Investor Gazette Subscription Handler
function handleSubscribe(e) {
  e.preventDefault();
  const name = document.getElementById("sub-name").value.trim();
  const email = document.getElementById("sub-email").value.trim();
  const phone = document.getElementById("sub-phone").value.trim();

  const subscriberPayload = { name, email, phone, date: new Date().toISOString() };

  // Google Analytics 4 Newsletter Signup Event
  if (typeof window.NRN_TRACK_EVENT === "function") {
    window.NRN_TRACK_EVENT("sign_up", {
      method: "Investor Gazette",
      newsletter: "Bangalore Off-Market Gazette",
      event_category: "Engagement"
    });
  }

  // Send to Node.js REST API
  fetch("/api/subscribers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, phone })
  }).catch(() => {});

  // Save subscriber to CMS local cache
  if (CMS_DB) {
    CMS_DB.subscribers = CMS_DB.subscribers || [];
    const exists = CMS_DB.subscribers.some(s => s.email === email);
    if (!exists) {
      CMS_DB.subscribers.push(subscriberPayload);
      saveCMSData(CMS_DB);
    }
  }

  alert(`Thank you, ${name}! You have been granted access to the NRN Bangalore Off-Market Gazette. Confidential analytics will be dispatched to ${email}${phone ? ' and WhatsApp ' + phone : ''}.`);
  e.target.reset();
}
