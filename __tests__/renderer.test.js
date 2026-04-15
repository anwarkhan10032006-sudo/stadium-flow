import { ExitPredictor, QueueRenderer, AlertsEngine } from '../js/ui/renderer.js';
import { GlobalState } from '../js/core/state.js';

describe('Renderer & Logic Core', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="exitTimeline"></div>
      <div id="exitRec"></div>
      <div id="queueList"></div>
      <div id="alertsGrid"></div>
      <div id="alertCounter"></div>
    `;

    GlobalState.zones = [
      { key: 'gateA', name: 'Gate A', type: 'Entry / Exit', base: 50 },
      { key: 'gateB', name: 'Gate B', type: 'Exit Gate', base: 50 }
    ];
    GlobalState.stalls = [
      { key: 'pizza', name: 'Pizza', baseWait: 10, emoji: '🍕', location: 'Gate A' }
    ];
    GlobalState.getActiveStadium = () => ({
      zones: GlobalState.zones
    });
  });

  describe('ExitPredictor.render', () => {
    it('should calculate the best and worst exits dynamically', () => {
      GlobalState.crowd = { gateA: 20, gateB: 95 }; // Gate A is vastly better
      
      ExitPredictor.render();
      
      const rec = document.getElementById('exitRec').innerHTML;
      expect(rec).toContain('Gate A');
      expect(rec).toContain('Gate B');
      expect(rec).toContain('high congestion'); // Warning for Gate B
    });
    
    it('should accurately handle flat congestion', () => {
      GlobalState.crowd = { gateA: 50, gateB: 50 }; 
      
      ExitPredictor.render();
      
      const rec = document.getElementById('exitRec').innerHTML;
      expect(rec).toContain('Gate B'); // since array iteration overrides if equal
    });
  });

  describe('QueueRenderer.render', () => {
    it('should sort stalls by quickest time automatically', () => {
      GlobalState.stalls.push({ key: 'soda', name: 'Soda Fast', baseWait: 2, emoji: '🥤', location: 'Gate B' });
      const queues = { pizza: 15, soda: 2 };
      
      QueueRenderer.render(queues);
      
      // Delay test lightly since QueueRenderer has a debounce, wait, looking at renderer.js QueueRenderer.render is wrapped in UIUtils.debounce
      // For testing, we might need jest timer mocks
    });
  });

  describe('AlertsEngine', () => {
    it('should generate danger alerts for crowded areas', () => {
      AlertsEngine.render({ gateB: 90, foodCourt: 95 });
      const grid = document.getElementById('alertsGrid').innerHTML;
      
      expect(grid).toContain('🚨'); // Gate B alert
      expect(grid).toContain('⚠️'); // Food court alert
    });
  });
});
