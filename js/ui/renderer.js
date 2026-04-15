import { GlobalState } from '../core/state.js';
import { DataEngine } from '../core/dataEngine.js';
import { ALERT_POOL, TICKER_MSGS, NEARBY_SERVICES, EXIT_MODEL } from '../config.js';

export const UIUtils = (() => {
  let _toastTimer = null;
  let _clockTimer = null;
  let _debounceTimer = null;

  const showToast = (message) => {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
  };

  const setFirebaseStatus = (connected) => {
    const chip  = document.getElementById('firebaseStatusChip');
    const label = document.getElementById('firebaseStatusLabel');
    const badge = document.getElementById('dataSourceBadge');
    if(!chip || !label) return;

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

  const startClock = () => {
    const el = document.getElementById('headerClock');
    if(!el) return;
    const tick = () => { el.textContent = new Date().toLocaleTimeString('en-IN', { hour12: false }); };
    tick();
    _clockTimer = setInterval(tick, 1000);
  };

  const setLastUpdated = (text) => {
    const el = document.getElementById('crowdLastUpdated');
    if (el) el.textContent = text;
  };

  const initTicker = () => {
    const inner = document.getElementById('tickerInner');
    if(!inner) return;
    const repeated = [...TICKER_MSGS, ...TICKER_MSGS].join('   ·   ');
    inner.textContent = repeated;
  };

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
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  };

  const withSpin = (btnId, fn) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', () => {
      btn.classList.add('spinning');
      setTimeout(() => { fn(); btn.classList.remove('spinning'); }, 600);
    });
  };

  const debounce = (func, timeout = 300) => {
    return (...args) => {
      clearTimeout(_debounceTimer);
      _debounceTimer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
  };

  return { showToast, setFirebaseStatus, startClock, setLastUpdated, initTicker, initBottomNav, withSpin, debounce };
})();

export const CrowdRenderer = (() => {
  const grid = () => document.getElementById('crowdGrid');

  const sparklineHTML = (key, currentPct) => {
    const history = DataEngine.getSparkHistory(key);
    const bars = [];
    for (let i = 0; i < 7; i++) {
      const h = history[i] !== undefined ? history[i] : Math.round(Math.random() * 60 + 10);
      bars.push(`<div class="sparkline-bar" style="height:${Math.round(h * 0.2) + 2}px; opacity:${0.3 + (i / 7) * 0.5};"></div>`);
    }
    bars.push(`<div class="sparkline-bar current" style="height:${Math.round(currentPct * 0.2) + 2}px;"></div>`);
    return `<div class="crowd-card__sparkline" aria-hidden="true">${bars.join('')}</div>`;
  };

  const render = (crowdData) => {
    const g = grid();
    if(!g) return;
    g.innerHTML = '';
    const fragment = document.createDocumentFragment();

    GlobalState.zones.forEach((zone, idx) => {
      const pct   = crowdData[zone.key] ?? zone.base;
      const level = DataEngine.crowdLevel(pct);
      const label = DataEngine.crowdLabel(pct);
      DataEngine.recordSpark(zone.key, pct);

      const card = document.createElement('div');
      card.className = `crowd-card ${level}`;
      card.setAttribute('role', 'listitem');
      card.setAttribute('aria-label', `${zone.name}: ${label}, ${pct}% full`);
      card.style.animationDelay = `${idx * 0.04}s`;

      card.innerHTML = window.DOMPurify ? window.DOMPurify.sanitize(`
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
      `) : '';
      fragment.appendChild(card);
    });
    
    g.appendChild(fragment);

    requestAnimationFrame(() => {
      document.querySelectorAll('.progress-fill').forEach(el => { el.style.width = el.dataset.target + '%'; });
    });
  };

  const update = (crowdData) => {
    const g = grid();
    if(!g) return;
    const cards = g.querySelectorAll('.crowd-card');
    if (cards.length !== GlobalState.zones.length) { render(crowdData); return; }

    GlobalState.zones.forEach((zone, i) => {
      const pct   = crowdData[zone.key] ?? zone.base;
      const level = DataEngine.crowdLevel(pct);
      const label = DataEngine.crowdLabel(pct);
      const card  = cards[i];

      DataEngine.recordSpark(zone.key, pct);

      card.className = `crowd-card ${level}`;
      card.setAttribute('aria-label', `${zone.name}: ${label}, ${pct}% full`);
      card.querySelector('.crowd-card__pct').textContent = `${pct}%`;
      card.querySelector('.crowd-card__status').innerHTML = `<span class="status-dot"></span> ${label.toUpperCase()}`;
      card.querySelector('.progress-fill').style.width = `${pct}%`;
      card.querySelector('.progress-fill').dataset.target = pct;

      const sl = card.querySelector('.crowd-card__sparkline');
      if (sl) sl.outerHTML = sparklineHTML(zone.key, pct);
    });
  };

  return { render, update: UIUtils.debounce(update, 50) };
})();

export const QueueRenderer = (() => {
  const container = () => document.getElementById('queueList');
  const render = (queueData) => {
    const c = container();
    if(!c) return;
    const enriched = GlobalState.stalls.map(s => ({
      ...s,
      wait: queueData[s.key] !== undefined
        ? Math.round(queueData[s.key])
        : Math.max(1, Math.round(s.baseWait + (Math.random() * 6 - 3))),
    }));
    enriched.sort((a, b) => a.wait - b.wait);
    const bestKey = enriched[0]?.key;

    c.innerHTML = '';
    enriched.forEach((stall, idx) => {
      const isBest = stall.key === bestKey;
      const barPct = Math.min(Math.round((stall.wait / 45) * 100), 100);
      const color = stall.wait <= 7 ? 'var(--c-green)' : stall.wait <= 15 ? 'var(--c-yellow)' : 'var(--c-red)';
      const badge = isBest ? { cls: 'best', label: '⭐ Best' } : stall.wait <= 7 ? { cls: 'short', label: 'Short' } : stall.wait <= 15 ? { cls: 'med', label: 'Medium' } : { cls: 'long', label: 'Long' };

      const item = document.createElement('div');
      item.className = `queue-item${isBest ? ' best' : ''}`;
      item.setAttribute('role', 'listitem');
      item.style.animationDelay = `${idx * 0.05}s`;

      item.innerHTML = window.DOMPurify ? window.DOMPurify.sanitize(`
        <span class="queue-emoji" aria-hidden="true">${stall.emoji}</span>
        <div class="queue-info">
          <div class="queue-name">${stall.name}</div>
          <div class="queue-loc">📍 ${stall.location}</div>
          <div class="queue-bar-track">
            <div class="queue-bar-fill" style="background:${color}; width:0%;" data-target="${barPct}"></div>
          </div>
        </div>
        <div class="queue-right">
          <div class="queue-wait" style="color:${color};">${stall.wait}m</div>
          <div class="queue-wait-lbl">Est. wait</div>
          <span class="q-badge ${badge.cls}">${badge.label}</span>
        </div>
      `) : '';
      c.appendChild(item);
    });

    requestAnimationFrame(() => {
      document.querySelectorAll('.queue-bar-fill').forEach(el => { el.style.width = el.dataset.target + '%'; });
    });
  };
  return { render: UIUtils.debounce(render, 50) };
})();

export const ExitPredictor = (() => {
  const TONE_MAP = {
    green:  { color: 'var(--c-green)',  dim: 'var(--c-green-dim)',  border: 'var(--c-green-border)'  },
    yellow: { color: 'var(--c-yellow)', dim: 'var(--c-yellow-dim)', border: 'var(--c-yellow-border)' },
    red:    { color: 'var(--c-red)',    dim: 'var(--c-red-dim)',    border: 'var(--c-red-border)'    },
  };

  const render = () => {
    const timeline = document.getElementById('exitTimeline');
    if(!timeline) return;
    timeline.innerHTML = '';
    EXIT_MODEL.forEach((slot, i) => {
      const t = TONE_MAP[slot.tone];
      const segs = Array.from({ length: 5 }, (_, j) => {
        const filled = j < slot.level;
        const segColor = slot.level >= 4 ? 'var(--c-red)' : slot.level >= 3 ? 'var(--c-yellow)' : 'var(--c-green)';
        const style = filled ? `background:${segColor}; box-shadow:0 0 4px ${segColor};` : '';
        return `<div class="meter-seg" style="${style}"></div>`;
      }).join('');

      const div = document.createElement('div');
      div.className = 'exit-slot';
      div.setAttribute('role', 'listitem');
      div.style.animationDelay = `${i * 0.06}s`;
      div.innerHTML = window.DOMPurify ? window.DOMPurify.sanitize(`
        <div class="exit-timing" style="background:${t.dim}; color:${t.color}; border-color:${t.border};">${slot.label}</div>
        <div class="exit-info">
          <div class="exit-info__label">${slot.level >= 4 ? '🔴' : slot.level >= 3 ? '🟡' : '🟢'} ${{ low:'Low', medium:'Medium', high:'High' }[slot.level <= 2 ? 'low' : slot.level <= 3 ? 'medium' : 'high']} Congestion</div>
          <div class="exit-info__desc">${slot.desc}</div>
        </div>
        <div class="exit-meter" aria-label="${slot.level} out of 5 congestion level">${segs}</div>
      `) : '';
      timeline.appendChild(div);
    });

    const rec = document.getElementById('exitRec');
    if(rec) {
      // Dynamic Logic Implementation
      const crowd = GlobalState.crowd;
      const stadium = GlobalState.getActiveStadium();
      
      let bestExit = 'an exit';
      let bestExitCongestion = 100;
      let worstExit = 'an exit';
      let worstExitCongestion = 0;

      if (crowd) {
        stadium.zones.filter(z => z.type === 'Exit Gate' || z.type === 'Entry / Exit').forEach(z => {
          const congestion = crowd[z.key] || z.base;
          if (congestion < bestExitCongestion) {
            bestExitCongestion = congestion;
            bestExit = z.name;
          }
          if (congestion > worstExitCongestion) {
            worstExitCongestion = congestion;
            worstExit = z.name;
          }
        });
      }

      rec.innerHTML = window.DOMPurify ? window.DOMPurify.sanitize(`
        <div class="exit-rec__icon" aria-hidden="true">💡</div>
        <div>
          <div class="exit-rec__title">StadiumIQ Dynamic Recommendation</div>
          <div class="exit-rec__desc">
            Leave <strong>10 minutes before the final whistle</strong> via <em>${bestExit}</em> for the smoothest experience. Predicted wait: <strong>under 3 minutes</strong>. ${worstExit !== bestExit ? `<em>${worstExit}</em> is expected to have <strong>high congestion</strong>.` : ''}
          </div>
        </div>
      `) : '';
    }
  };
  return { render };
})();

export const AlertsEngine = (() => {
  const generateAlerts = (crowdData) => {
    const dynamic = [];
    if (crowdData) {
      if ((crowdData.gateB ?? 0) > 70) dynamic.push({ type: 'danger', icon: '🚨', msg: `Gate B is at ${crowdData.gateB}% capacity. Reroute to Gate A.` });
      if ((crowdData.foodCourt ?? 0) > 75) dynamic.push({ type: 'warning', icon: '⚠️', msg: `Food Court at ${crowdData.foodCourt}%. Expect longer queues.` });
      if ((crowdData.exitA ?? 100) < 35) dynamic.push({ type: 'success', icon: '✅', msg: `Exit A at only ${crowdData.exitA}% — currently the best exit.` });
      if ((crowdData.restrooms ?? 0) > 70) dynamic.push({ type: 'warning', icon: '🚻', msg: `Restrooms busy (${crowdData.restrooms}%). Use South Stand facilities.` });
    }
    const staticAlerts = [...ALERT_POOL].sort(() => Math.random() - 0.5).slice(0, 4);
    return [...dynamic, ...staticAlerts].slice(0, 6);
  };

  const render = (crowdData) => {
    const alerts = generateAlerts(crowdData);
    const grid = document.getElementById('alertsGrid');
    const counter = document.getElementById('alertCounter');
    if(!grid || !counter) return;

    counter.textContent = alerts.length;
    grid.innerHTML = '';
    alerts.forEach((alert, i) => {
      const minAgo = Math.floor(Math.random() * 12) + 1;
      const card = document.createElement('div');
      card.className = `alert-card ${alert.type}`;
      card.setAttribute('role', 'article');
      card.style.animationDelay = `${i * 0.05}s`;
      card.innerHTML = window.DOMPurify ? window.DOMPurify.sanitize(`
        <div class="alert-card__icon" aria-hidden="true">${alert.icon}</div>
        <div class="alert-card__msg">${alert.msg}</div>
        <div class="alert-card__meta">${minAgo} min ago · Live data</div>
      `): '';
      grid.appendChild(card);
    });
  };
  return { render };
})();

import { GoogleMapsService } from '../services/googleMaps.js';

export const MapsModule = (() => {
  const init = async () => {
    await GoogleMapsService.loadScript();
  };

  const render = () => {
    const grid = document.getElementById('mapsGrid');
    if(!grid) return;
    grid.innerHTML = '';
    NEARBY_SERVICES.forEach(svc => {
      const tile = document.createElement('button');
      tile.className = 'maps-tile';
      tile.setAttribute('role', 'listitem');
      tile.setAttribute('aria-label', `Find ${svc.label} nearby`);
      tile.innerHTML = window.DOMPurify ? window.DOMPurify.sanitize(`
        <span class="maps-tile__icon" aria-hidden="true">${svc.emoji}</span>
        <span class="maps-tile__label">${svc.label}</span>
        <span class="maps-tile__sub">${svc.sub}</span>
      `) : '';
      tile.addEventListener('click', () => GoogleMapsService.searchNearby(svc.query));
      grid.appendChild(tile);
    });
  };
  return { init, render };
})();
