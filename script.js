/**
 * ═══════════════════════════════════════════════════════════
 *  StadiumIQ — script.js
 *  Smart Stadium Experience Assistant
 *
 *  Architecture:
 *   ├─ FirebaseService   — Firebase Realtime DB + fallback sim
 *   ├─ DataEngine        — Processes raw data, derives analytics
 *   ├─ CrowdRenderer     — Renders crowd density section
 *   ├─ NavEngine         — Route lookup and rendering
 *   ├─ QueueRenderer     — Food stall queue UI
 *   ├─ ExitPredictor     — Exit rush timeline + recommendation
 *   ├─ AlertsEngine      — Dynamic alert generation
 *   ├─ MapsModule        — Google Maps tiles
 *   ├─ UIUtils           — Toast, clock, ticker, nav tabs
 *   └─ App               — Bootstrap & orchestration
 * ═══════════════════════════════════════════════════════════
 *
 *  Firebase config: Replace the FIREBASE_CONFIG object below
 *  with your own project credentials.
 *  If Firebase is unreachable, the app falls back to a smooth
 *  simulated real-time mode automatically.
 */

'use strict';

/* ──────────────────────────────────────────────────────────
   0. FIREBASE CONFIGURATION
   Replace with your Firebase project credentials.
   The app WILL work without this (simulation fallback).
   ────────────────────────────────────────────────────────── */
const FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  databaseURL:       "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

/**
 * Expected Firebase Realtime DB structure:
 * {
 *   "crowd": {
 *     "gateA":     75,   // 0-100 occupancy %
 *     "gateB":     40,
 *     "foodCourt": 85,
 *     "exitA":     60,
 *     "exitB":     25,
 *     "northStand":55,
 *     "southStand":50,
 *     "vipLounge": 30,
 *     "restrooms": 65,
 *     "parking":   70
 *   },
 *   "queues": {
 *     "pizza":    5,    // wait time in minutes
 *     "burger":   18,
 *     "biryani":  12,
 *     "drinks":   7,
 *     "iceCream": 9,
 *     "snacks":   3
 *   },
 *   "alerts": {         // optional dynamic alerts
 *     "a1": { "type": "danger", "msg": "Gate B overcrowded", "icon": "🚨" }
 *   }
 * }
 */

/* ──────────────────────────────────────────────────────────
   1. STATIC ZONE & STALL DEFINITIONS
   ────────────────────────────────────────────────────────── */

/** Multi-stadium configuration payload */
const STADIUMS = {
  bangalore: {
    id: 'bangalore',
    name: 'M. Chinnaswamy Stadium',
    locationQuery: 'M. Chinnaswamy Stadium Bangalore',
    match: { status: 'Live', title: 'RCB vs CSK', time: '7:30 PM' },
    zones: [
      { key: 'gateA', name: 'Gate 1 (Cubbon Pk)', type: 'Entry / Exit', emoji: '🚪', base: 75 },
      { key: 'gateB', name: 'Gate 7 (Queens Rd)', type: 'Entry / Exit', emoji: '🚪', base: 45 },
      { key: 'foodCourt', name: 'P Pavilion Food', type: 'Concession', emoji: '🍕', base: 85 },
      { key: 'exitA', name: 'Exit 1', type: 'Exit Gate', emoji: '🟢', base: 20 },
      { key: 'exitB', name: 'Exit 7', type: 'Exit Gate', emoji: '🔴', base: 80 },
      { key: 'northStand', name: 'P Pavilion', type: 'Seating', emoji: '💺', base: 65 },
      { key: 'southStand', name: 'Corporate Box', type: 'Premium', emoji: '⭐', base: 45 },
      { key: 'vipLounge', name: 'KSCA Lounge', type: 'Premium', emoji: '⭐', base: 35 },
      { key: 'restrooms', name: 'Restrooms', type: 'Facilities', emoji: '🚻', base: 60 },
      { key: 'parking', name: 'UB City Parking', type: 'Lot', emoji: '🅿️', base: 90 },
    ],
    stalls: [
      { key: 'pizza', emoji: '🍕', name: 'Oven Story', location: 'Gate 1', baseWait: 15 },
      { key: 'burger', emoji: '🍔', name: 'Burger Station', location: 'P Pavilion', baseWait: 10 },
      { key: 'biryani', emoji: '🍛', name: 'Nandhana Palace', location: 'Corporate Box', baseWait: 18 },
      { key: 'drinks', emoji: '🥤', name: 'Fresh Juice', location: 'Gate 7', baseWait: 5 },
      { key: 'iceCream', emoji: '🍦', name: 'Corner House', location: 'East Stand', baseWait: 12 },
      { key: 'snacks', emoji: '🥨', name: 'Quick Bites', location: 'Gate 1', baseWait: 6 },
    ]
  },
  mumbai: {
    id: 'mumbai',
    name: 'Wankhede Stadium',
    locationQuery: 'Wankhede Stadium Mumbai',
    match: { status: 'Live', title: 'MI vs DC', time: '8:00 PM' },
    zones: [
      { key: 'gateA', name: 'Vinoo Mankad Gate', type: 'Entry / Exit', emoji: '🚪', base: 80 },
      { key: 'gateB', name: 'University Gate', type: 'Entry / Exit', emoji: '🚪', base: 55 },
      { key: 'foodCourt', name: 'Marine Concourse', type: 'Concession', emoji: '🍕', base: 92 },
      { key: 'exitA', name: 'North Exit', type: 'Exit Gate', emoji: '🟢', base: 40 },
      { key: 'exitB', name: 'South Exit', type: 'Exit Gate', emoji: '🔴', base: 85 },
      { key: 'northStand', name: 'North Stand', type: 'Seating', emoji: '💺', base: 75 },
      { key: 'southStand', name: 'Garware Pavilion', type: 'Premium', emoji: '⭐', base: 60 },
      { key: 'vipLounge', name: 'MCA Lounge', type: 'Premium', emoji: '⭐', base: 40 },
      { key: 'restrooms', name: 'Restrooms', type: 'Facilities', emoji: '🚻', base: 70 },
      { key: 'parking', name: 'Churchgate Parking', type: 'Lot', emoji: '🅿️', base: 95 },
    ],
    stalls: [
      { key: 'vadapav', emoji: '🧆', name: 'Jumbo King', location: 'University Gate', baseWait: 10 },
      { key: 'burger', emoji: '🍔', name: 'Burger King', location: 'North Stand', baseWait: 15 },
      { key: 'biryani', emoji: '🍛', name: 'Zaffran', location: 'Garware Pavilion', baseWait: 20 },
      { key: 'drinks', emoji: '🥤', name: 'Chilled Bev', location: 'All Stands', baseWait: 5 },
      { key: 'iceCream', emoji: '🍦', name: 'Naturals', location: 'MCA Lounge', baseWait: 8 },
      { key: 'snacks', emoji: '🥨', name: 'Bhel Puri Kiosk', location: 'Marine Concourse', baseWait: 6 },
    ]
  },
  ahmedabad: {
    id: 'ahmedabad',
    name: 'Narendra Modi Stadium',
    locationQuery: 'Narendra Modi Stadium Ahmedabad',
    match: { status: 'Closed', title: 'No Event', time: '--' },
    zones: [
      { key: 'gateA', name: 'Gate 1', type: 'Entry / Exit', emoji: '🚪', base: 5 },
      { key: 'gateB', name: 'Gate 2', type: 'Entry / Exit', emoji: '🚪', base: 5 },
      { key: 'foodCourt', name: 'Food Court', type: 'Concession', emoji: '🍕', base: 5 },
      { key: 'exitA', name: 'Exit 1', type: 'Exit Gate', emoji: '🟢', base: 5 },
      { key: 'exitB', name: 'Exit 2', type: 'Exit Gate', emoji: '🔴', base: 5 },
      { key: 'northStand', name: 'North Stand', type: 'Seating', emoji: '💺', base: 5 },
      { key: 'southStand', name: 'South Stand', type: 'Seating', emoji: '💺', base: 5 },
      { key: 'vipLounge', name: 'Presidential', type: 'Premium', emoji: '⭐', base: 5 },
      { key: 'restrooms', name: 'Restrooms', type: 'Facilities', emoji: '🚻', base: 5 },
      { key: 'parking', name: 'Main Parking', type: 'Lot', emoji: '🅿️', base: 5 }
    ],
    stalls: [
      { key: 'dhokla', emoji: '🧆', name: 'Gujarati Snacks', location: 'Food Court', baseWait: 1 },
      { key: 'burger', emoji: '🍔', name: 'Fast Food', location: 'North', baseWait: 1 },
      { key: 'pizza', emoji: '🍕', name: 'Pizza', location: 'South', baseWait: 1 },
      { key: 'drinks', emoji: '🥤', name: 'Drinks', location: 'Gate 1', baseWait: 1 },
      { key: 'iceCream', emoji: '🍦', name: 'Ice Cream', location: 'Gate 2', baseWait: 1 },
      { key: 'snacks', emoji: '🥨', name: 'Snacks', location: 'All Stands', baseWait: 1 }
    ]
  },
  kolkata: {
    id: 'kolkata',
    name: 'Eden Gardens',
    locationQuery: 'Eden Gardens Kolkata',
    match: { status: 'Upcoming', title: 'KKR vs RR', time: 'Tomorrow 3:30 PM' },
    zones: [
      { key: 'gateA', name: 'Gate 3', type: 'Entry / Exit', emoji: '🚪', base: 5 },
      { key: 'gateB', name: 'Gate 4', type: 'Entry / Exit', emoji: '🚪', base: 5 },
      { key: 'foodCourt', name: 'Club House Food', type: 'Concession', emoji: '🍕', base: 5 },
      { key: 'exitA', name: 'Exit 3', type: 'Exit Gate', emoji: '🟢', base: 5 },
      { key: 'exitB', name: 'Exit 4', type: 'Exit Gate', emoji: '🔴', base: 5 },
      { key: 'northStand', name: 'BC Roy Club', type: 'Seating', emoji: '💺', base: 5 },
      { key: 'southStand', name: 'K Block', type: 'Seating', emoji: '💺', base: 5 },
      { key: 'vipLounge', name: 'CAB Lounge', type: 'Premium', emoji: '⭐', base: 5 },
      { key: 'restrooms', name: 'Restrooms', type: 'Facilities', emoji: '🚻', base: 5 },
      { key: 'parking', name: 'Maidan Parking', type: 'Lot', emoji: '🅿️', base: 5 }
    ],
    stalls: [
      { key: 'rolls', emoji: '🌯', name: 'Kathi Rolls', location: 'Club House', baseWait: 1 },
      { key: 'burger', emoji: '🍔', name: 'Burgers', location: 'Gate 3', baseWait: 1 },
      { key: 'biryani', emoji: '🍛', name: 'Aminia Biryani', location: 'K Block', baseWait: 1 },
      { key: 'drinks', emoji: '🥤', name: 'Drinks', location: 'Gate 4', baseWait: 1 },
      { key: 'iceCream', emoji: '🍦', name: 'Ice Cream', location: 'Club House', baseWait: 1 },
      { key: 'snacks', emoji: '🥨', name: 'Snacks', location: 'All Stands', baseWait: 1 }
    ]
  },
  chennai: {
    id: 'chennai',
    name: 'MA Chidambaram Stadium',
    locationQuery: 'MA Chidambaram Stadium Chennai',
    match: { status: 'Live', title: 'CSK vs SRH', time: '7:30 PM' },
    zones: [
      { key: 'gateA', name: 'Gate 11', type: 'Entry / Exit', emoji: '🚪', base: 85 },
      { key: 'gateB', name: 'Gate 2', type: 'Entry / Exit', emoji: '🚪', base: 60 },
      { key: 'foodCourt', name: 'Pavilion Food', type: 'Concession', emoji: '🍕', base: 88 },
      { key: 'exitA', name: 'Exit 11', type: 'Exit Gate', emoji: '🟢', base: 30 },
      { key: 'exitB', name: 'Exit 2', type: 'Exit Gate', emoji: '🔴', base: 75 },
      { key: 'northStand', name: 'I Stand', type: 'Seating', emoji: '💺', base: 80 },
      { key: 'southStand', name: 'C Stand', type: 'Seating', emoji: '💺', base: 85 },
      { key: 'vipLounge', name: 'MCC Lounge', type: 'Premium', emoji: '⭐', base: 50 },
      { key: 'restrooms', name: 'Restrooms', type: 'Facilities', emoji: '🚻', base: 65 },
      { key: 'parking', name: 'MRTS Parking', type: 'Lot', emoji: '🅿️', base: 90 },
    ],
    stalls: [
      { key: 'filterCoffee', emoji: '☕', name: 'Mylapore Coffee', location: 'Pavilion', baseWait: 8 },
      { key: 'dosa', emoji: '🥞', name: 'Saravana Bhavan', location: 'C Stand', baseWait: 15 },
      { key: 'biryani', emoji: '🍛', name: 'Buhari Biryani', location: 'Gate 2', baseWait: 22 },
      { key: 'drinks', emoji: '🥤', name: 'Cold Drinks', location: 'All Stands', baseWait: 5 },
      { key: 'iceCream', emoji: '🍦', name: 'Arun Icecreams', location: 'I Stand', baseWait: 10 },
      { key: 'snacks', emoji: '🥨', name: 'Murukku Kiosk', location: 'Gate 11', baseWait: 4 },
    ]
  }
};

let activeStadiumId = 'mumbai';
let ZONES = STADIUMS[activeStadiumId].zones;
let STALLS = STADIUMS[activeStadiumId].stalls;

/** Exit timing prediction model */
const EXIT_MODEL = [
  { label: 'Leave Now',       desc: 'Match in progress — exits nearly empty',          level: 1, tone: 'green'  },
  { label: '10 min before',   desc: 'Mild crowd forming — still comfortable to exit',  level: 2, tone: 'green'  },
  { label: 'At Final Whistle',desc: 'Rush begins — all gates surge simultaneously',    level: 4, tone: 'red'    },
  { label: '15 min after',    desc: 'Peak rush — expect 30–40 min wait at exits',      level: 5, tone: 'red'    },
  { label: '30 min after',    desc: 'Crowd dispersing — flow returning to normal',     level: 2, tone: 'yellow' },
];

/** Alert pool — a rotating subset is shown at runtime */
const ALERT_POOL = [
  { type: 'danger',  icon: '🚨', msg: 'Gate B is overcrowded. Use Gate A or Gate C.' },
  { type: 'warning', icon: '⚠️', msg: 'Food Court wait >20 min. Try North Wing stalls.' },
  { type: 'success', icon: '✅', msg: 'Exit A is currently clear — smooth flow confirmed.' },
  { type: 'info',    icon: 'ℹ️', msg: 'VIP parking access opens at Gate 7 in 15 min.' },
  { type: 'danger',  icon: '🔴', msg: 'North Stand restrooms at capacity. Use South Stand.' },
  { type: 'warning', icon: '⚡', msg: 'High crowd expected at Exit B post-match.' },
  { type: 'success', icon: '🟢', msg: 'Medical Bay fully available — no queue.' },
  { type: 'info',    icon: '📍', msg: 'Shuttle from Gate C running every 5 minutes.' },
  { type: 'danger',  icon: '🚧', msg: 'Elevator 3 (North Stand) is temporarily out of service.' },
  { type: 'success', icon: '🎯', msg: 'Quick Bites kiosk (Gate A) has shortest wait — only 3 min.' },
];

/** Ticker messages */
const TICKER_MSGS = [
  '🚨 Gate B overcrowded · Use Gate A',
  '✅ Exit A clear · Smooth flow now',
  '⚠️ Food Court: 20 min wait',
  '📍 Shuttle at Gate C every 5 min',
  '🔴 North restrooms at capacity',
  '🟢 Medical Bay open · No queue',
  '⚡ Exit rush expected after match',
  '🅿️ Lot 3 full · Use Lot 5',
  '🎯 Quick Bites: Best option right now',
];

/** Nearby services for Maps integration */
const NEARBY_SERVICES = [
  { emoji: '🏥', label: 'Hospitals',  sub: 'Emergency care',    query: 'hospitals near me' },
  { emoji: '🅿️', label: 'Parking',    sub: 'Available lots',    query: 'parking near stadium' },
  { emoji: '🍽️', label: 'Restaurants',sub: 'Nearby dining',     query: 'restaurants near me' },
  { emoji: '🚌', label: 'Transit',    sub: 'Bus & Metro stops',  query: 'bus stop near me' },
  { emoji: '💳', label: 'ATMs',       sub: 'Nearest cashpoints', query: 'ATM near me' },
  { emoji: '🚖', label: 'Cab Pickup', sub: 'Ride-hailing zone',  query: 'taxi cab near me' },
];

/* ──────────────────────────────────────────────────────────
   2. FIREBASE SERVICE MODULE
   ────────────────────────────────────────────────────────── */

/**
 * FirebaseService
 * Attempts to dynamically import Firebase and set up
 * realtime listeners. Falls back to simulation on any failure.
 */
const FirebaseService = (() => {
  let _isConnected = false;
  let _onDataCallback = null;

  /** Returns true if Firebase is providing live data */
  const isConnected = () => _isConnected;

  /**
   * Registers a callback to receive data updates.
   * Callback receives: { crowd: {}, queues: {} }
   */
  const onData = (callback) => { _onDataCallback = callback; };

  /** Emits data to the registered callback */
  const emit = (data) => { if (_onDataCallback) _onDataCallback(data); };

  /** Initialises Firebase and attaches onValue listeners */
  const connect = async () => {
    try {
      // Guard: if credentials are placeholder, go straight to sim
      if (FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') {
        throw new Error('Firebase credentials not configured');
      }

      // Dynamically load Firebase SDK (avoids blocking if unavailable)
      const { initializeApp } = await import(
        'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js'
      );
      const { getDatabase, ref, onValue } = await import(
        'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js'
      );

      const app = initializeApp(FIREBASE_CONFIG);
      const db  = getDatabase(app);

      // Listen to the root of our data tree
      const dataRef = ref(db, '/');
      onValue(dataRef, (snapshot) => {
        const val = snapshot.val();
        if (!val) return;

        _isConnected = true;
        UIUtils.setFirebaseStatus(true);

        emit({
          crowd:  val.crowd  || {},
          queues: val.queues || {},
        });
      }, () => {
        // DB error handler — fall back to simulation
        _isConnected = false;
        UIUtils.setFirebaseStatus(false);
        startSimulation();
      });

    } catch (err) {
      // Firebase unavailable — start simulation
      console.info('[StadiumIQ] Firebase not available. Simulation mode active.', err.message);
      _isConnected = false;
      UIUtils.setFirebaseStatus(false);
      startSimulation();
    }
  };

  return { connect, isConnected, onData };
})();

/* ──────────────────────────────────────────────────────────
   3. DATA ENGINE  (simulation + data processing)
   ────────────────────────────────────────────────────────── */

const DataEngine = (() => {
  let _simulationTimer = null;

  // Sparkline history per zone (stores last 8 readings)
  const _sparkHistory = {};
  ZONES.forEach(z => { _sparkHistory[z.key] = []; });

  /** Utility: integer in range [min, max] */
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  /** Utility: clamp value */
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  /** Applies ±jitter to a base value */
  const jitter = (base, spread = 15) => clamp(base + randInt(-spread, spread), 3, 97);

  /**
   * Generates a full simulated crowd + queue snapshot.
   * Called every 5 s in simulation mode.
   */
  const generateSnapshot = () => {
    const crowd  = {};
    const queues = {};
    const currentStadium = STADIUMS[activeStadiumId];

    if (currentStadium.match.status !== 'Live') {
      ZONES.forEach(z  => { crowd[z.key]  = z.base; });
      STALLS.forEach(s => { queues[s.key] = s.baseWait; });
      return { crowd, queues };
    }

    ZONES.forEach(z  => { crowd[z.key]  = jitter(z.base, 18); });
    STALLS.forEach(s => { queues[s.key] = clamp(s.baseWait + randInt(-3, 6), 1, 45); });
    return { crowd, queues };
  };

  /**
   * Derives crowd level string from occupancy %.
   * @param {number} pct
   * @returns {'low'|'medium'|'high'}
   */
  const crowdLevel = (pct) => {
    if (pct < 40) return 'low';
    if (pct < 70) return 'medium';
    return 'high';
  };

  /**
   * Returns human-readable level label.
   */
  const crowdLabel = (pct) => ['Low', 'Medium', 'High'][[pct < 40, pct < 70, true].indexOf(true)];

  /**
   * Records occupancy into sparkline history for a zone.
   */
  const recordSpark = (key, pct) => {
    if (!_sparkHistory[key]) _sparkHistory[key] = [];
    _sparkHistory[key].push(pct);
    if (_sparkHistory[key].length > 8) _sparkHistory[key].shift();
  };

  const getSparkHistory = (key) => _sparkHistory[key] || [];

  return { generateSnapshot, crowdLevel, crowdLabel, recordSpark, getSparkHistory };
})();

/* ──────────────────────────────────────────────────────────
   4. SIMULATION ENGINE (starts when Firebase is unavailable)
   ────────────────────────────────────────────────────────── */

/** Timer reference for the live simulation interval */
let _simTimer = null;
let _simCallback = null;

/**
 * Starts the simulated real-time data feed.
 * Fires immediately and then every 5 seconds.
 * @param {Function} [onTick] - optional additional tick handler
 */
function startSimulation(onTick) {
  if (onTick) _simCallback = onTick;

  // Emit first snapshot immediately
  const snap = DataEngine.generateSnapshot();
  if (_simCallback) _simCallback(snap);

  // Clear any previous timer
  if (_simTimer) clearInterval(_simTimer);

  // Emit new data every 5 seconds
  _simTimer = setInterval(() => {
    const snap = DataEngine.generateSnapshot();
    if (_simCallback) _simCallback(snap);
  }, 5000);
}

/* ──────────────────────────────────────────────────────────
   5. CROWD RENDERER
   ────────────────────────────────────────────────────────── */

const CrowdRenderer = (() => {
  const grid = () => document.getElementById('crowdGrid');

  /** Builds sparkline HTML for a given zone key */
  const sparklineHTML = (key, currentPct) => {
    const history = DataEngine.getSparkHistory(key);
    // Generate 8 bars (pad with random values if insufficient history)
    const bars = [];
    for (let i = 0; i < 7; i++) {
      const h = history[i] !== undefined ? history[i] : Math.round(Math.random() * 60 + 10);
      bars.push(`<div class="sparkline-bar" style="height:${Math.round(h * 0.2) + 2}px; opacity:${0.3 + (i / 7) * 0.5};"></div>`);
    }
    bars.push(`<div class="sparkline-bar current" style="height:${Math.round(currentPct * 0.2) + 2}px;"></div>`);
    return `<div class="crowd-card__sparkline" aria-hidden="true">${bars.join('')}</div>`;
  };

  /**
   * Full re-render of all zone cards.
   * @param {Object} crowdData - { [zoneKey]: occupancyPct }
   */
  const render = (crowdData) => {
    const g = grid();
    g.innerHTML = '';

    ZONES.forEach((zone, idx) => {
      const pct   = crowdData[zone.key] ?? zone.base;
      const level = DataEngine.crowdLevel(pct);
      const label = DataEngine.crowdLabel(pct);

      DataEngine.recordSpark(zone.key, pct);

      const card = document.createElement('div');
      card.className = `crowd-card ${level}`;
      card.setAttribute('role', 'listitem');
      card.setAttribute('aria-label', `${zone.name}: ${label}, ${pct}% full`);
      card.style.animationDelay = `${idx * 0.04}s`;

      card.innerHTML = window.DOMPurify ? DOMPurify.sanitize(`
        <div class="crowd-card__top">
          <span class="crowd-card__emoji" aria-hidden="true">${zone.emoji}</span>
          <span class="crowd-card__pct" aria-hidden="true">${pct}%</span>
        </div>
        <div class="crowd-card__name">${zone.name}</div>
        <div class="crowd-card__type">${zone.type}</div>
        <div class="crowd-card__status" aria-hidden="true">
          <span class="status-dot"></span>
          ${label.toUpperCase()}
        </div>
        <div class="progress-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
          <div class="progress-fill" data-target="${pct}"></div>
        </div>
        ${sparklineHTML(zone.key, pct)}
      `) : ''; // Fallback if script blocked
      g.appendChild(card);
    });

    // Animate progress bars on next paint
    requestAnimationFrame(() => {
      document.querySelectorAll('.progress-fill').forEach(el => {
        el.style.width = el.dataset.target + '%';
      });
    });
  };

  /**
   * Smooth update — updates existing cards without re-building DOM.
   * Falls back to full render if cards don't exist.
   */
  const update = (crowdData) => {
    const cards = grid().querySelectorAll('.crowd-card');
    if (cards.length !== ZONES.length) { render(crowdData); return; }

    ZONES.forEach((zone, i) => {
      const pct   = crowdData[zone.key] ?? zone.base;
      const level = DataEngine.crowdLevel(pct);
      const label = DataEngine.crowdLabel(pct);
      const card  = cards[i];

      DataEngine.recordSpark(zone.key, pct);

      // Update class
      card.className = `crowd-card ${level}`;
      card.setAttribute('aria-label', `${zone.name}: ${label}, ${pct}% full`);

      // Update text
      card.querySelector('.crowd-card__pct').textContent        = `${pct}%`;
      card.querySelector('.crowd-card__status').innerHTML       =
        `<span class="status-dot"></span> ${label.toUpperCase()}`;
      card.querySelector('.progress-fill').style.width          = `${pct}%`;
      card.querySelector('.progress-fill').dataset.target       = pct;
      card.setAttribute('aria-label', `${zone.name}: ${label}, ${pct}% full`);

      // Refresh sparkline
      const sl = card.querySelector('.crowd-card__sparkline');
      if (sl) sl.outerHTML = sparklineHTML(zone.key, pct);
    });
  };

  return { render, update };
})();

/* ──────────────────────────────────────────────────────────
   6. NAVIGATION ENGINE
   ────────────────────────────────────────────────────────── */

const NavEngine = (() => {
  /**
   * Route database keyed by "from::to".
   * Each entry has: time (min), congestion (text), steps[].
   */
  const ROUTES = {
    'entrance::mySeat': {
      time: 4, congestion: 'Low congestion',
      steps: [
        { icon: '🚪', text: 'Enter through Main Entrance security', sub: 'Bag check complete', tag: 'clear' },
        { icon: '↗️', text: 'Take left corridor past the info desk', sub: '~80 m walk', tag: 'clear' },
        { icon: '🪜', text: 'Use Staircase 3 or Lift B — Level 2', sub: 'Lift: 30s wait', tag: 'clear' },
        { icon: '💺', text: 'Arrive at Block G7 · Row 12 · Seat 44', sub: 'Your assigned seat', tag: null },
      ]
    },
    'entrance::foodCourt': {
      time: 2, congestion: 'Moderate congestion',
      steps: [
        { icon: '🚪', text: 'Pass through Main Entrance (internal)', sub: null, tag: 'clear' },
        { icon: '↘️', text: 'Head right along Central Promenade', sub: '~60 m walk', tag: 'clear' },
        { icon: '🍕', text: 'Food Court — main entrance on your left', sub: 'Currently busy', tag: 'busy' },
      ]
    },
    'gateA::mySeat': {
      time: 6, congestion: 'Low congestion',
      steps: [
        { icon: '🚪', text: 'Clear Gate A — currently low traffic', sub: null, tag: 'clear' },
        { icon: '↑',  text: 'North Corridor straight ahead', sub: '~120 m walk', tag: 'clear' },
        { icon: '🪜', text: 'Staircase 2 or Lift B to Level 3', sub: null, tag: 'clear' },
        { icon: '↗️', text: 'Follow "Block G" signs left at top', sub: null, tag: 'clear' },
        { icon: '💺', text: 'Seat: Row 12, Block G7, Seat 44', sub: null, tag: null },
      ]
    },
    'gateB::exitA': {
      time: 9, congestion: '⚠️ High congestion at Gate B',
      steps: [
        { icon: '🔴', text: 'Gate B — HIGH congestion. Avoid if possible.', sub: 'Consider Gate A instead', tag: 'danger' },
        { icon: '↙️', text: 'Head south via East Corridor (signs: Exit A)', sub: '~200 m', tag: 'clear' },
        { icon: '↙️', text: 'Pass restroom block — continue straight', sub: null, tag: 'clear' },
        { icon: '🟢', text: 'Exit A — currently clear!', sub: 'Expected wait: <2 min', tag: 'clear' },
      ]
    },
    'parking::mySeat': {
      time: 8, congestion: 'Moderate congestion',
      steps: [
        { icon: '🅿️', text: 'Exit Parking Lot — Lot 2 recommended', sub: null, tag: 'busy' },
        { icon: '🚶', text: 'Cross pedestrian bridge to Gate A', sub: '~3 min walk', tag: 'clear' },
        { icon: '🔒', text: 'Security screening at Gate A', sub: 'Low queue now', tag: 'clear' },
        { icon: '↗️', text: 'Follow internal signage to Block G7', sub: null, tag: 'clear' },
        { icon: '💺', text: 'Arrive at your seat', sub: 'Row 12 · Seat 44', tag: null },
      ]
    },
    'default': {
      time: 5, congestion: 'Optimal path selected',
      steps: [
        { icon: '📍', text: 'Starting from your current location', sub: null, tag: 'clear' },
        { icon: '↗️', text: 'Follow least-congested path (auto-selected)', sub: 'Live crowd data used', tag: 'clear' },
        { icon: '🏁', text: 'Arrive at your destination', sub: null, tag: null },
      ]
    }
  };

  const render = () => {
    const from  = document.getElementById('navFrom').value;
    const to    = document.getElementById('navTo').value;
    const key   = `${from}::${to}`;
    const route = ROUTES[key] || { ...ROUTES['default'], time: Math.floor(Math.random() * 8) + 3 };
    const el    = document.getElementById('routeResult');

    el.classList.remove('hidden');
    el.innerHTML = window.DOMPurify ? DOMPurify.sanitize(`
      <div class="route-banner">
        <div class="route-banner__left">
          📍 ${from} &nbsp;→&nbsp; ${to}<br>
          <span style="color:var(--text-dim);font-size:11px;">${route.congestion}</span>
        </div>
        <div class="route-time">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ~${route.time} min
        </div>
      </div>
      <div class="route-steps">
        ${route.steps.map(s => `
          <div class="route-step">
            <div class="step-node" aria-hidden="true">${s.icon}</div>
            <div class="step-body">
              <div class="step-text">${s.text}</div>
              ${s.sub ? `<div class="step-sub">${s.sub}</div>` : ''}
            </div>
            ${s.tag ? `<span class="step-tag ${s.tag}">${
              s.tag === 'clear' ? 'Clear' : s.tag === 'busy' ? 'Busy' : 'Avoid'
            }</span>` : ''}
          </div>
        `).join('')}
      </div>
    `) : '';

    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    UIUtils.showToast(`Route found · ~${route.time} min`);
  };

  return { render };
})();

/* ──────────────────────────────────────────────────────────
   7. QUEUE RENDERER
   ────────────────────────────────────────────────────────── */

const QueueRenderer = (() => {
  const container = () => document.getElementById('queueList');

  const render = (queueData) => {
    // Merge live data with stall definitions
    const enriched = STALLS.map(s => ({
      ...s,
      wait: queueData[s.key] !== undefined
        ? Math.round(queueData[s.key])
        : Math.max(1, Math.round(s.baseWait + (Math.random() * 6 - 3))),
    }));

    // Sort ascending by wait (best first)
    enriched.sort((a, b) => a.wait - b.wait);
    const bestKey = enriched[0].key;

    const c = container();
    c.innerHTML = '';

    enriched.forEach((stall, idx) => {
      const isBest   = stall.key === bestKey;
      const barPct   = Math.min(Math.round((stall.wait / 45) * 100), 100);
      const barColor = stall.wait <= 7  ? 'var(--c-green)'  :
                       stall.wait <= 15 ? 'var(--c-yellow)' : 'var(--c-red)';
      const waitColor = stall.wait <= 7  ? 'var(--c-green)'  :
                        stall.wait <= 15 ? 'var(--c-yellow)' : 'var(--c-red)';
      const badge    = isBest
        ? { cls: 'best', label: '⭐ Best' }
        : stall.wait <= 7  ? { cls: 'short', label: 'Short' }
        : stall.wait <= 15 ? { cls: 'med',   label: 'Medium' }
        :                    { cls: 'long',  label: 'Long' };

      const item = document.createElement('div');
      item.className = `queue-item${isBest ? ' best' : ''}`;
      item.setAttribute('role', 'listitem');
      item.style.animationDelay = `${idx * 0.05}s`;

      item.innerHTML = window.DOMPurify ? DOMPurify.sanitize(`
        <span class="queue-emoji" aria-hidden="true">${stall.emoji}</span>
        <div class="queue-info">
          <div class="queue-name">${stall.name}</div>
          <div class="queue-loc">📍 ${stall.location}</div>
          <div class="queue-bar-track">
            <div class="queue-bar-fill" style="background:${barColor}; width:0%;" data-target="${barPct}"></div>
          </div>
        </div>
        <div class="queue-right">
          <div class="queue-wait" style="color:${waitColor};">${stall.wait}m</div>
          <div class="queue-wait-lbl">Est. wait</div>
          <span class="q-badge ${badge.cls}">${badge.label}</span>
        </div>
      `) : '';
      c.appendChild(item);
    });

    // Animate bars
    requestAnimationFrame(() => {
      document.querySelectorAll('.queue-bar-fill').forEach(el => {
        el.style.width = el.dataset.target + '%';
      });
    });
  };

  return { render };
})();

/* ──────────────────────────────────────────────────────────
   8. EXIT PREDICTOR
   ────────────────────────────────────────────────────────── */

const ExitPredictor = (() => {
  const TONE_MAP = {
    green:  { color: 'var(--c-green)',  dim: 'var(--c-green-dim)',  border: 'var(--c-green-border)'  },
    yellow: { color: 'var(--c-yellow)', dim: 'var(--c-yellow-dim)', border: 'var(--c-yellow-border)' },
    red:    { color: 'var(--c-red)',    dim: 'var(--c-red-dim)',    border: 'var(--c-red-border)'    },
  };

  const render = () => {
    const timeline = document.getElementById('exitTimeline');
    timeline.innerHTML = '';

    EXIT_MODEL.forEach((slot, i) => {
      const t = TONE_MAP[slot.tone];

      // Build 5-segment meter
      const segs = Array.from({ length: 5 }, (_, j) => {
        const filled = j < slot.level;
        const segColor = slot.level >= 4 ? 'var(--c-red)'   :
                         slot.level >= 3 ? 'var(--c-yellow)' : 'var(--c-green)';
        const style = filled
          ? `background:${segColor}; box-shadow:0 0 4px ${segColor};`
          : '';
        return `<div class="meter-seg" style="${style}"></div>`;
      }).join('');

      const div = document.createElement('div');
      div.className = 'exit-slot';
      div.setAttribute('role', 'listitem');
      div.style.animationDelay = `${i * 0.06}s`;
      div.innerHTML = window.DOMPurify ? DOMPurify.sanitize(`
        <div class="exit-timing" style="
          background:${t.dim}; color:${t.color}; border-color:${t.border};
        ">${slot.label}</div>
        <div class="exit-info">
          <div class="exit-info__label">${
            slot.level >= 4 ? '🔴' : slot.level >= 3 ? '🟡' : '🟢'
          } ${{ low:'Low', medium:'Medium', high:'High' }[
            slot.level <= 1 ? 'low' : slot.level <= 2 ? 'low' : slot.level <= 3 ? 'medium' : 'high'
          ]} Congestion</div>
          <div class="exit-info__desc">${slot.desc}</div>
        </div>
        <div class="exit-meter" aria-label="${slot.level} out of 5 congestion level">${segs}</div>
      `) : '';
      timeline.appendChild(div);
    });

    // Smart recommendation card
    document.getElementById('exitRec').innerHTML = window.DOMPurify ? DOMPurify.sanitize(`
      <div class="exit-rec__icon" aria-hidden="true">💡</div>
      <div>
        <div class="exit-rec__title">StadiumIQ Recommendation</div>
        <div class="exit-rec__desc">
          Leave <strong>10 minutes before the final whistle</strong> via
          <em>Exit A</em> for the smoothest experience.
          Predicted wait: <strong>under 3 minutes</strong>.
          Exit B is expected to have <strong>high congestion</strong> post-match.
        </div>
      </div>
    `) : '';
  };

  return { render };
})();

/* ──────────────────────────────────────────────────────────
   9. ALERTS ENGINE
   ────────────────────────────────────────────────────────── */

const AlertsEngine = (() => {
  /**
   * Generates dynamic alerts based on current crowd data.
   * Adds extra crowd-derived alerts on top of the static pool.
   */
  const generateAlerts = (crowdData) => {
    const dynamic = [];

    // Derive alerts from live crowd percentages
    if (crowdData) {
      if ((crowdData.gateB ?? 0) > 70)
        dynamic.push({ type: 'danger',  icon: '🚨', msg: `Gate B is at ${crowdData.gateB}% capacity. Reroute to Gate A.` });
      if ((crowdData.foodCourt ?? 0) > 75)
        dynamic.push({ type: 'warning', icon: '⚠️', msg: `Food Court at ${crowdData.foodCourt}%. Expect longer queues.` });
      if ((crowdData.exitA ?? 100) < 35)
        dynamic.push({ type: 'success', icon: '✅', msg: `Exit A at only ${crowdData.exitA}% — currently the best exit.` });
      if ((crowdData.restrooms ?? 0) > 70)
        dynamic.push({ type: 'warning', icon: '🚻', msg: `Restrooms busy (${crowdData.restrooms}%). Use South Stand facilities.` });
    }

    // Shuffle and slice static pool
    const staticAlerts = [...ALERT_POOL].sort(() => Math.random() - 0.5).slice(0, 4);

    // Merge: dynamic first, fill to max 6 with static
    const merged = [...dynamic, ...staticAlerts].slice(0, 6);
    return merged;
  };

  const render = (crowdData) => {
    const alerts = generateAlerts(crowdData);
    const grid   = document.getElementById('alertsGrid');
    const now    = new Date();

    document.getElementById('alertCounter').textContent = alerts.length;

    grid.innerHTML = '';
    alerts.forEach((alert, i) => {
      const minAgo = Math.floor(Math.random() * 12) + 1;
      const card   = document.createElement('div');
      card.className = `alert-card ${alert.type}`;
      card.setAttribute('role', 'article');
      card.style.animationDelay = `${i * 0.05}s`;
      card.innerHTML = `
        <div class="alert-card__icon" aria-hidden="true">${alert.icon}</div>
        <div class="alert-card__msg">${alert.msg}</div>
        <div class="alert-card__meta">${minAgo} min ago · Live data</div>
      `;
      grid.appendChild(card);
    });
  };

  return { render };
})();

/* ──────────────────────────────────────────────────────────
   10. MAPS MODULE
   ────────────────────────────────────────────────────────── */

const MapsModule = (() => {
  const render = () => {
    const grid = document.getElementById('mapsGrid');
    grid.innerHTML = '';
    NEARBY_SERVICES.forEach(svc => {
      const tile = document.createElement('button');
      tile.className = 'maps-tile';
      tile.setAttribute('role', 'listitem');
      tile.setAttribute('aria-label', `Find ${svc.label} nearby`);
      tile.innerHTML = `
        <span class="maps-tile__icon" aria-hidden="true">${svc.emoji}</span>
        <span class="maps-tile__label">${svc.label}</span>
        <span class="maps-tile__sub">${svc.sub}</span>
      `;
      tile.addEventListener('click', () => openMaps(svc.query));
      grid.appendChild(tile);
    });
  };

  return { render };
})();

/**
 * Opens Google Maps for a given query, biased to a generic stadium location.
 * @param {string} query
 */
function openMaps(query) {
  const encoded = encodeURIComponent(`${query} near stadium`);
  window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank', 'noopener,noreferrer');
}

/* ──────────────────────────────────────────────────────────
   11. UI UTILITIES
   ────────────────────────────────────────────────────────── */

const UIUtils = (() => {
  let _toastTimer = null;
  let _clockTimer = null;

  /** Shows a temporary toast notification */
  const showToast = (message) => {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.classList.add('show');
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
  };

  /** Updates the Firebase status chip in the header */
  const setFirebaseStatus = (connected) => {
    const chip  = document.getElementById('firebaseStatusChip');
    const label = document.getElementById('firebaseStatusLabel');
    const badge = document.getElementById('dataSourceBadge');

    if (connected) {
      chip.classList.add('connected');
      label.textContent = 'Firebase Live';
      if (badge) { badge.textContent = '● Firebase'; badge.classList.add('firebase'); }
    } else {
      chip.classList.remove('connected');
      label.textContent = 'Simulated';
      if (badge) { badge.textContent = '● Simulated'; badge.classList.remove('firebase'); }
    }
  };

  /** Starts the header clock */
  const startClock = () => {
    const el = document.getElementById('headerClock');
    const tick = () => {
      el.textContent = new Date().toLocaleTimeString('en-IN', { hour12: false });
    };
    tick();
    _clockTimer = setInterval(tick, 1000);
  };

  /** Updates the "last updated" label */
  const setLastUpdated = (text) => {
    const el = document.getElementById('crowdLastUpdated');
    if (el) el.textContent = text;
  };

  /** Initialises the scrolling alert ticker */
  const initTicker = () => {
    const inner = document.getElementById('tickerInner');
    const repeated = [...TICKER_MSGS, ...TICKER_MSGS].join('   ·   ');
    inner.textContent = repeated;
  };

  /** Wires up bottom navigation tab switching */
  const initBottomNav = () => {
    document.querySelectorAll('.bnav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.bnav-item').forEach(b => {
          b.classList.remove('active');
          b.removeAttribute('aria-current');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-current', 'page');

        const target = document.getElementById(btn.dataset.target);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  };

  /** Wires spinning animation to a refresh button */
  const withSpin = (btnId, fn) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', () => {
      btn.classList.add('spinning');
      setTimeout(() => { fn(); btn.classList.remove('spinning'); }, 600);
    });
  };

  return { showToast, setFirebaseStatus, startClock, setLastUpdated, initTicker, initBottomNav, withSpin };
})();

/* ──────────────────────────────────────────────────────────
   11b. STADIUM MANAGER
   ────────────────────────────────────────────────────────── */

const StadiumManager = (() => {
  const init = () => {
    const sel = document.getElementById('stadiumSelect');
    sel.innerHTML = '';
    // Populate dropdown
    Object.values(STADIUMS).forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name;
      if (s.id === activeStadiumId) opt.selected = true;
      sel.appendChild(opt);
    });

    sel.addEventListener('change', (e) => {
      switchStadium(e.target.value);
    });

    // Initial UI Setup
    applyStadiumState(activeStadiumId);
  };

  const switchStadium = (id) => {
    // 1. Shimmer effect
    const main = document.getElementById('main');
    main.classList.remove('anim-fade');
    void main.offsetWidth; // trigger reflow
    main.classList.add('anim-fade');

    // 2. Set Active Data
    activeStadiumId = id;
    ZONES = STADIUMS[id].zones;
    STALLS = STADIUMS[id].stalls;

    // 3. Clear History
    ZONES.forEach(z => DataEngine.getSparkHistory(z.key).length = 0);

    // 4. Update UI State completely
    applyStadiumState(id);
    
    // 5. Fire immediate snapshot update
    startSimulation(onDataUpdate); 
    UIUtils.showToast(`Switched to ${STADIUMS[id].name}`);
  };

  const applyStadiumState = (id) => {
    const s = STADIUMS[id];
    const match = s.match;
    const overlay = document.getElementById('mainOverlay');
    const title = document.getElementById('overlayTitle');
    const sub = document.getElementById('overlaySub');
    const icon = document.getElementById('overlayIcon');
    const statusChip = document.getElementById('matchStatusChip');
    const statusLabel = document.getElementById('matchStatusLabel');
    
    // Update top header status
    statusChip.className = 'status-chip';
    if (match.status === 'Live') {
      statusChip.classList.add('status-chip--live');
      statusLabel.textContent = `LIVE: ${match.title}`;
    } else if (match.status === 'Upcoming') {
      statusChip.classList.add('status-chip--upcoming');
      statusLabel.textContent = `UPCOMING: ${match.title}`;
    } else {
      statusChip.classList.add('status-chip--closed');
      statusLabel.textContent = 'STADIUM CLOSED';
    }

    // Toggle overlay
    if (match.status !== 'Live') {
      overlay.classList.remove('hidden');
      if (match.status === 'Upcoming') {
        icon.textContent = '⏱️';
        title.textContent = 'Event Starts Soon';
        sub.textContent = `${match.title} · ${match.time}`;
      } else {
        icon.textContent = '🏟️';
        title.textContent = 'Stadium Closed';
        sub.textContent = 'No active events right now';
      }
    } else {
      overlay.classList.add('hidden');
    }

    // Update Maps dynamically based on location
    NEARBY_SERVICES.forEach(svc => {
      svc.query = (svc.label + ' near ' + s.locationQuery).toLowerCase();
    });
    MapsModule.render();

    // Re-render UI pieces with initial snapshot
    const snap = DataEngine.generateSnapshot();
    CrowdRenderer.render(snap.crowd);
    QueueRenderer.render(snap.queues);
    AlertsEngine.render(snap.crowd);
    
    // Refresh Dropdowns for Route Finder depending on the Zones Available
    const nFrom = document.getElementById('navFrom');
    const nTo = document.getElementById('navTo');
    const optionsHtml = ZONES.map(z => `<option value="${z.key}">${z.name}</option>`).join('');
    if(nFrom) nFrom.innerHTML = `<option value="entrance">Main Entrance</option> <option value="parking">Parking Lot</option>` + optionsHtml;
    if(nTo) nTo.innerHTML = `<option value="mySeat">My Seat</option> <option value="medic">Medical Bay</option>` + optionsHtml;
  };

  return { init, switchStadium, applyStadiumState };
})();

/* ──────────────────────────────────────────────────────────
   12. APPLICATION BOOTSTRAP
   ────────────────────────────────────────────────────────── */

/**
 * Master state — holds the latest crowd & queue snapshot.
 * Updated every 5 s (simulation) or on every Firebase push.
 */
const AppState = { crowd: {}, queues: {} };

/**
 * Central update handler — called whenever new data arrives
 * (from Firebase listener OR simulation tick).
 * @param {{ crowd: Object, queues: Object }} data
 */
function onDataUpdate(data) {
  AppState.crowd  = data.crowd  || AppState.crowd;
  AppState.queues = data.queues || AppState.queues;

  // Update crowd cards (smooth update if possible)
  CrowdRenderer.update(AppState.crowd);

  // Update queue list
  QueueRenderer.render(AppState.queues);

  // Regenerate alerts based on new crowd data
  AlertsEngine.render(AppState.crowd);

  // Update timestamp
  UIUtils.setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour12: true }));
}

document.addEventListener('DOMContentLoaded', () => {
  /* ── Static renders (don't depend on live data) ── */
  UIUtils.startClock();
  UIUtils.initTicker();
  UIUtils.initBottomNav();
  ExitPredictor.render();

  /* ── Initialize Stadium Manager (renders initial layout) ── */
  StadiumManager.init();

  /* ── Initial crowd render with base values ── */
  const initialData = DataEngine.generateSnapshot();
  AppState.crowd  = initialData.crowd;
  AppState.queues = initialData.queues;

  /* ── Wire refresh buttons ── */
  UIUtils.withSpin('refreshCrowdBtn', () => {
    const snap = DataEngine.generateSnapshot();
    onDataUpdate(snap);
    UIUtils.showToast('Crowd data refreshed');
  });
  UIUtils.withSpin('refreshQueuesBtn', () => {
    const snap = DataEngine.generateSnapshot();
    QueueRenderer.render(snap.queues);
    AppState.queues = snap.queues;
    UIUtils.showToast('Queue data refreshed');
  });

  /* ── Wire Get Route button ── */
  document.getElementById('getRouteBtn').addEventListener('click', NavEngine.render);

  /* ── Attempt Firebase connection ── */
  FirebaseService.onData(onDataUpdate);
  FirebaseService.connect().then(() => {
    // If Firebase connects, it will drive updates via onData callback.
    // If it fails, startSimulation() is called inside FirebaseService.connect().
  });

  // Fallback: always start simulation (Firebase takes precedence if it connects)
  _simCallback = onDataUpdate;
  startSimulation(onDataUpdate);

  /* ── Auto-refresh alerts every 30 s for freshness ── */
  setInterval(() => AlertsEngine.render(AppState.crowd), 30_000);

  /* ── Welcome toast ── */
  setTimeout(() => UIUtils.showToast('StadiumIQ ready · Live data active'), 1000);
});
