import { FIREBASE_CONFIG } from '../config.js';
import { UIUtils } from '../ui/renderer.js';

export const FirebaseService = (() => {
  let _isConnected = false;
  let _onDataCallback = null;

  const isConnected = () => _isConnected;
  const onData = (callback) => { _onDataCallback = callback; };
  const emit = (data) => { if (_onDataCallback) _onDataCallback(data); };

  const connect = async (onSimulateFallback) => {
    try {
      if (FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') {
        throw new Error('Firebase credentials not configured. Setup environment vars.');
      }

      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
      const { getDatabase, ref, onValue } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');

      const app = initializeApp(FIREBASE_CONFIG);
      const db  = getDatabase(app);
      const dataRef = ref(db, '/');

      onValue(dataRef, (snapshot) => {
        const val = snapshot.val();
        if (!val) {
          throw new Error('No data at root');
        }

        _isConnected = true;
        UIUtils.setFirebaseStatus(true);
        emit({ crowd: val.crowd || {}, queues: val.queues || {} });
      }, (error) => {
        console.warn('Firebase error fetching data:', error);
        _isConnected = false;
        UIUtils.setFirebaseStatus(false);
        if (onSimulateFallback) onSimulateFallback();
      });

    } catch (err) {
      console.info('[StadiumIQ] Firebase fetch block: ', err.message);
      _isConnected = false;
      UIUtils.setFirebaseStatus(false);
      if(onSimulateFallback) onSimulateFallback();
    }
  };

  return { connect, isConnected, onData };
})();
