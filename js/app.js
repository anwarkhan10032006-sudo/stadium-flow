import { GlobalState } from './core/state.js';
import { DataEngine } from './core/dataEngine.js';
import { NavEngine } from './core/navEngine.js';
import { StadiumManager } from './core/stadiumManager.js';
import { FirebaseService } from './services/firebase.js';
import { UIUtils, CrowdRenderer, QueueRenderer, ExitPredictor, AlertsEngine } from './ui/renderer.js';

let _simTimer = null;

function startSimulation() {
  const snap = DataEngine.generateSnapshot();
  onDataUpdate(snap);

  if (_simTimer) clearInterval(_simTimer);
  _simTimer = setInterval(() => {
    const s = DataEngine.generateSnapshot();
    onDataUpdate(s);
  }, 5000);
}

function triggerSimulationTick() {
  const snap = DataEngine.generateSnapshot();
  onDataUpdate(snap);
}

function onDataUpdate(data) {
  try {
    GlobalState.crowd = data.crowd || GlobalState.crowd;
    GlobalState.queues = data.queues || GlobalState.queues;

    CrowdRenderer.update(GlobalState.crowd);
    QueueRenderer.render(GlobalState.queues);
    AlertsEngine.render(GlobalState.crowd);

    UIUtils.setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour12: true }));
  } catch (e) {
    console.error("Error during UI update: ", e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  DataEngine.initHistory();
  UIUtils.startClock();
  UIUtils.initTicker();
  UIUtils.initBottomNav();
  ExitPredictor.render();

  StadiumManager.init(triggerSimulationTick);

  const initialData = DataEngine.generateSnapshot();
  GlobalState.crowd = initialData.crowd;
  GlobalState.queues = initialData.queues;

  UIUtils.withSpin('refreshCrowdBtn', () => {
    const snap = DataEngine.generateSnapshot();
    onDataUpdate(snap);
    UIUtils.showToast('Crowd data refreshed');
  });

  UIUtils.withSpin('refreshQueuesBtn', () => {
    const snap = DataEngine.generateSnapshot();
    QueueRenderer.render(snap.queues);
    GlobalState.queues = snap.queues;
    UIUtils.showToast('Queue data refreshed');
  });

  const routeBtn = document.getElementById('getRouteBtn');
  if(routeBtn) {
    routeBtn.addEventListener('click', NavEngine.render);
  }

  FirebaseService.onData(onDataUpdate);
  FirebaseService.connect(startSimulation).then(() => {
    if (!FirebaseService.isConnected()) {
      startSimulation();
    }
  }).catch(() => {
    startSimulation(); // fallback
  });

  setInterval(() => AlertsEngine.render(GlobalState.crowd), 30000);

  setTimeout(() => UIUtils.showToast('StadiumIQ ready · Modularized'), 1000);
});
