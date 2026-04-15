import { Logger } from './logger.js';

/**
 * Service for dynamically loading and utilizing the Google Maps Places API.
 */
export const GoogleMapsService = (() => {
  let isLoaded = false;
  let loadingPromise = null;
  let currentApiKey = null;

  /**
   * Fetches the Google Maps API Key from the server backend.
   */
  const fetchKey = async () => {
    if (currentApiKey) return currentApiKey;
    try {
      const response = await fetch('/api/config');
      if (!response.ok) throw new Error('Could not load Maps config');
      const data = await response.json();
      currentApiKey = data.googleMapsApi;
      return currentApiKey;
    } catch (err) {
      Logger.error('GoogleMaps', 'Failed fetching Maps API key', {}, err);
      return null;
    }
  };

  /**
   * Dynamically loads the generic Google Maps JS SDK onto the page.
   */
  const loadScript = async () => {
    if (isLoaded) return Promise.resolve();
    if (loadingPromise) return loadingPromise;

    loadingPromise = new Promise(async (resolve, reject) => {
      const key = await fetchKey();
      if (!key || key === 'dummy_maps_key') {
        const msg = 'Google Maps API key is missing or dummy. Using fallback link behavior.';
        Logger.info('GoogleMaps', msg);
        resolve(false); // resolve with false to indicate it's not truly loaded
        return;
      }

      window._googleMapsCallback = () => {
        Logger.info('GoogleMaps', 'Script loaded successfully');
        isLoaded = true;
        delete window._googleMapsCallback;
        resolve(true);
      };

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=_googleMapsCallback`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        Logger.error('GoogleMaps', 'Script injection failed');
        reject(new Error('Google Maps script failed to load'));
      };
      document.head.appendChild(script);
    });

    return loadingPromise;
  };

  /**
   * Provides the raw map opening functionality or the advanced integration when fully loaded.
   * @param {string} query The natural language query to pass to Google Maps
   */
  const searchNearby = (query) => {
    const encoded = encodeURIComponent(`${query}`);
    // If we actually place a map module, we would use places API here. 
    // Since we preserve UI, we open the link in a robust way, but we could also
    // do a background places fetch to augment data if needed.
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  return { loadScript, searchNearby, isLoaded: () => isLoaded };
})();
