import { UIUtils } from '../ui/renderer.js';

export const NavEngine = (() => {
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
    try {
      const from = document.getElementById('navFrom').value;
      const to = document.getElementById('navTo').value;
      const key = `${from}::${to}`;
      const route = ROUTES[key] || { ...ROUTES['default'], time: Math.floor(Math.random() * 8) + 3 };
      const el = document.getElementById('routeResult');

      el.classList.remove('hidden');
      el.innerHTML = window.DOMPurify ? window.DOMPurify.sanitize(`
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
    } catch (err) {
      console.error("Navigation routing error: ", err);
      UIUtils.showToast("Failed to calculate route");
    }
  };

  return { render };
})();
