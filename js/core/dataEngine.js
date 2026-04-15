import { GlobalState } from './state.js';

export const DataEngine = (() => {
  const _sparkHistory = {};

  /**
   * Initializes the sparkline history arrays for all zones.
   * Ensures every stadium zone has an empty history buffer ready.
   */
  const initHistory = () => {
    GlobalState.zones.forEach(z => {
      if (!_sparkHistory[z.key]) _sparkHistory[z.key] = [];
    });
  };

  /** 
   * Utility: Return random integer in range [min, max] 
   * @param {number} min 
   * @param {number} max 
   * @returns {number}
   */
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  /** 
   * Utility: clamp value within bounds 
   * @param {number} v - value to clamp
   * @param {number} min - lower bound
   * @param {number} max - upper bound
   * @returns {number}
   */
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  /** 
   * Applies ±jitter to a base value and clamps it softly
   * @param {number} base - base percentage 
   * @param {number} spread - max variance
   * @returns {number}
   */
  const jitter = (base, spread = 15) => clamp(base + randInt(-spread, spread), 3, 97);

  /**
   * Generates a full simulated crowd + queue snapshot.
   * Optimized to avoid unnecessary object allocations.
   */
  const _cachedCrowd = {};
  const _cachedQueues = {};

  const generateSnapshot = () => {
    const currentStadium = GlobalState.getActiveStadium();

    if (currentStadium.match.status !== 'Live') {
      for (let i = 0; i < GlobalState.zones.length; i++) {
        _cachedCrowd[GlobalState.zones[i].key] = GlobalState.zones[i].base;
      }
      for (let i = 0; i < GlobalState.stalls.length; i++) {
        _cachedQueues[GlobalState.stalls[i].key] = GlobalState.stalls[i].baseWait;
      }
      return { crowd: { ..._cachedCrowd }, queues: { ..._cachedQueues } };
    }

    for (let i = 0; i < GlobalState.zones.length; i++) {
      _cachedCrowd[GlobalState.zones[i].key] = jitter(GlobalState.zones[i].base, 18);
    }
    for (let i = 0; i < GlobalState.stalls.length; i++) {
      _cachedQueues[GlobalState.stalls[i].key] = clamp(GlobalState.stalls[i].baseWait + randInt(-3, 6), 1, 45);
    }
    
    // Return shallow copies to not accidentally mutate the cache elsewhere
    return { crowd: { ..._cachedCrowd }, queues: { ..._cachedQueues } };
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
