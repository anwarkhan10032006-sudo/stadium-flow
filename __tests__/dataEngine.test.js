import { DataEngine } from '../js/core/dataEngine.js';
import { GlobalState } from '../js/core/state.js';

describe('DataEngine', () => {
  beforeEach(() => {
    GlobalState.setStadium('mumbai'); // Wankhede
  });

  test('crowdLevel should return correct level based on percentage', () => {
    expect(DataEngine.crowdLevel(30)).toBe('low');
    expect(DataEngine.crowdLevel(50)).toBe('medium');
    expect(DataEngine.crowdLevel(80)).toBe('high');
  });

  test('crowdLabel should return correct label', () => {
    expect(DataEngine.crowdLabel(39)).toBe('Low');
    expect(DataEngine.crowdLabel(69)).toBe('Medium');
    expect(DataEngine.crowdLabel(71)).toBe('High');
  });

  test('recordSpark should maintain only 8 items in history', () => {
    DataEngine.clearHistory('gateA');
    for (let i = 1; i <= 10; i++) {
      DataEngine.recordSpark('gateA', i * 10);
    }
    const history = DataEngine.getSparkHistory('gateA');
    expect(history.length).toBe(8);
    expect(history[0]).toBe(30);
    expect(history[7]).toBe(100);
  });

  test('generateSnapshot returns expected structure and values within bounded ranges', () => {
    const snapshot = DataEngine.generateSnapshot();
    
    expect(snapshot).toHaveProperty('crowd');
    expect(snapshot).toHaveProperty('queues');
    
    // Check ranges based on base values + jitter
    const gateABase = GlobalState.zones.find(z => z.key === 'gateA').base;
    expect(snapshot.crowd['gateA']).toBeGreaterThanOrEqual(Math.max(3, gateABase - 20));
  });

  test('stress test: generate 10000 snapshots without memory bloat', () => {
    const memoryBefore = process.memoryUsage().heapUsed;
    for (let i = 0; i < 10000; i++) {
        DataEngine.generateSnapshot();
    }
    const memoryAfter = process.memoryUsage().heapUsed;
    const mbBloat = (memoryAfter - memoryBefore) / 1024 / 1024;
    // Ensuring caching prevents rapid bloat 
    expect(mbBloat).toBeLessThan(50); // Should be very minimal bloat with the optimizations
  });
});
