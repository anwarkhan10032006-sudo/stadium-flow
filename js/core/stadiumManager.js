import { GlobalState } from './state.js';
import { STADIUMS, NEARBY_SERVICES } from '../config.js';
import { DataEngine } from './dataEngine.js';
import { UIUtils, CrowdRenderer, QueueRenderer, AlertsEngine, MapsModule } from '../ui/renderer.js';

export const StadiumManager = (() => {
  let onSimulateTickCallback = null;

  const init = (simCallback) => {
    onSimulateTickCallback = simCallback;
    const sel = document.getElementById('stadiumSelect');
    if (!sel) return;

    sel.innerHTML = '';
    Object.values(STADIUMS).forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name;
      if (s.id === GlobalState.activeStadiumId) opt.selected = true;
      sel.appendChild(opt);
    });

    sel.addEventListener('change', (e) => {
      switchStadium(e.target.value);
    });

    applyStadiumState(GlobalState.activeStadiumId);
  };

  const switchStadium = (id) => {
    const main = document.getElementById('main');
    if(main) {
      main.classList.remove('anim-fade');
      void main.offsetWidth; // reflow
      main.classList.add('anim-fade');
    }

    GlobalState.setStadium(id);
    GlobalState.zones.forEach(z => DataEngine.clearHistory(z.key));
    
    applyStadiumState(id);
    if(onSimulateTickCallback) onSimulateTickCallback();
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
    
    if (statusChip && statusLabel) {
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
    }

    if (overlay) {
      if (match.status !== 'Live') {
        overlay.classList.remove('hidden');
        if (match.status === 'Upcoming') {
          if (icon) icon.textContent = '⏱️';
          if (title) title.textContent = 'Event Starts Soon';
          if (sub) sub.textContent = `${match.title} · ${match.time}`;
        } else {
          if (icon) icon.textContent = '🏟️';
          if (title) title.textContent = 'Stadium Closed';
          if (sub) sub.textContent = 'No active events right now';
        }
      } else {
        overlay.classList.add('hidden');
      }
    }

    NEARBY_SERVICES.forEach(svc => {
      svc.query = (svc.label + ' near ' + s.locationQuery).toLowerCase();
    });
    MapsModule.render();

    const snap = DataEngine.generateSnapshot();
    CrowdRenderer.render(snap.crowd);
    QueueRenderer.render(snap.queues);
    AlertsEngine.render(snap.crowd);
    
    const nFrom = document.getElementById('navFrom');
    const nTo = document.getElementById('navTo');
    const optionsHtml = GlobalState.zones.map(z => `<option value="${z.key}">${z.name}</option>`).join('');
    if(nFrom) nFrom.innerHTML = `<option value="entrance">Main Entrance</option> <option value="parking">Parking Lot</option>` + optionsHtml;
    if(nTo) nTo.innerHTML = `<option value="mySeat">My Seat</option> <option value="medic">Medical Bay</option>` + optionsHtml;
  };

  return { init, switchStadium, applyStadiumState };
})();
