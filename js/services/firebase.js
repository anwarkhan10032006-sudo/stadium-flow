import { UIUtils } from '../ui/renderer.js';
import { Logger } from './logger.js';

export const FirebaseService = (() => {
  let _isConnected = false;
  let _onDataCallback = null;

  const isConnected = () => _isConnected;
  const onData = (callback) => { _onDataCallback = callback; };
  const emit = (data) => { if (_onDataCallback) _onDataCallback(data); };

  /**
   * Validates incoming data structure to ensure app stability
   */
  const validateSnapshot = (val) => {
    if (!val || typeof val !== 'object') throw new Error('Invalid snapshot root');
    const crowd = val.crowd || {};
    const queues = val.queues || {};
    
    // Type checking ensures we don't crash the renderer
    if (typeof crowd !== 'object' || typeof queues !== 'object') {
      throw new Error('Malformed crowd or queues payload');
    }
    return { crowd, queues };
  };

  const connect = async (onSimulateFallback) => {
    try {
      Logger.info('Firebase', 'Fetching configuration from server...');
      const response = await fetch('/api/config');
      if (!response.ok) throw new Error('Failed to fetch config');
      const configData = await response.json();
      const FIREBASE_CONFIG = configData.firebase;

      if (!FIREBASE_CONFIG || FIREBASE_CONFIG.apiKey === 'dummy_key' || !FIREBASE_CONFIG.apiKey) {
        throw new Error('Firebase credentials not properly configured or missing.');
      }

      Logger.info('Firebase', 'Initializing Firebase App...');
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
      const { getDatabase, ref, onValue } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');

      const app = initializeApp(FIREBASE_CONFIG);
      const db  = getDatabase(app);
      const dataRef = ref(db, '/');

      onValue(dataRef, (snapshot) => {
        try {
          const val = snapshot.val();
          if (!val) throw new Error('No data at root');
          
          const validatedData = validateSnapshot(val);

          _isConnected = true;
          UIUtils.setFirebaseStatus(true);
          Logger.info('Firebase', 'Realtime payload received and validated', { keys: Object.keys(validatedData) });
          emit(validatedData);
        } catch (validationErr) {
          Logger.error('Firebase', 'Data validation failed', {}, validationErr);
          // Don't disconnect, just drop the bad payload.
        }
      }, (error) => {
        Logger.warn('Firebase', 'Firebase read connection lost/error:', error);
        _isConnected = false;
        UIUtils.setFirebaseStatus(false);
        if (onSimulateFallback) onSimulateFallback();
      });

    } catch (err) {
      Logger.info('Firebase', `Falling back to simulation: ${err.message}`);
      _isConnected = false;
      UIUtils.setFirebaseStatus(false);
      if(onSimulateFallback) onSimulateFallback();
    }
  };

  return { connect, isConnected, onData };
})();
