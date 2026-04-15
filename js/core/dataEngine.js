import { GlobalState } from './state.js';

export const DataEngine = (() => {
  const _sparkHistory = {};

  const initHistory = () => {
    GlobalState.zones.forEach(z => {
      if (!_sparkHistory[z.key]) _sparkHistory[z.key] = [];
    });
  };

  /** Utility: integer in range [min, max] */
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  /** Utility: clamp value */
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  /** Applies ±jitter to a base value */
  const jitter = (base, spread = 15) => clamp(base + randInt(-spread, spread), 3, 97);

  /**
   * Generates a full simulated crowd + queue snapshot.
   */
  const generateSnapshot = () => {
    const crowd = {};
    const queues = {};
    const currentStadium = GlobalState.getActiveStadium();

    if (currentStadium.match.status !== 'Live') {
      GlobalState.zones.forEach(z => { crowd[z.key] = z.base; });
      GlobalState.stalls.forEach(s => { queues[s.key] = s.baseWait; });
      return { crowd, queues };
    }

    GlobalState.zones.forEach(z => { crowd[z.key] = jitter(z.base, 18); });
    GlobalState.stalls.forEach(s => { queues[s.key] = clamp(s.baseWait + randInt(-3, 6), 1, 45); });
    return { crowd, queues };
  };

  /** Derives crowd level string from occupancy % */
  const crowdLevel = (pct) => {
    if (pct < 40) return 'low';
    if (pct < 70) return 'medium';
    return 'high';
  };

  /** Returns human-readable level label */
  const crowdLabel = (pct) => ['Low', 'Medium', 'High'][[pct < 40, pct < 70, true].indexOf(true)];

  /** Records occupancy into sparkline history */
  const recordSpark = (key, pct) => {
    if (!_sparkHistory[key]) _sparkHistory[key] = [];
    _sparkHistory[key].push(pct);
    if (_sparkHistory[key].length > 8) _sparkHistory[key].shift();
  };

  const getSparkHistory = (key) => _sparkHistory[key] || [];

  const clearHistory = (key) => {
    _sparkHistory[key] = [];
  };

  return { initHistory, generateSnapshot, crowdLevel, crowdLabel, recordSpark, getSparkHistory, clearHistory };
})();
