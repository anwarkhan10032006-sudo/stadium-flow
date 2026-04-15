import { NavEngine } from '../js/core/navEngine.js';
import { UIUtils } from '../js/ui/renderer.js';

// Mock UIUtils.showToast
jest.mock('../js/ui/renderer.js', () => ({
  UIUtils: {
    showToast: jest.fn(),
    debounce: jest.fn(fn => fn)
  }
}));

describe('NavEngine Integration', () => {
  beforeEach(() => {
    // Set up DOM elements required by NavEngine
    document.body.innerHTML = `
      <select id="navFrom">
        <option value="entrance">Main Entrance</option>
        <option value="gateA">Gate A</option>
      </select>
      <select id="navTo">
        <option value="mySeat">My Seat</option>
        <option value="foodCourt">Food Court</option>
      </select>
      <div id="routeResult" class="hidden"></div>
      <div id="toast"></div>
    `;

    // Mock DOMPurify
    window.DOMPurify = {
      sanitize: (html) => html
    };

    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    
    // Clear mocks
    jest.clearAllMocks();
  });

  test('render calculates known route correctly', () => {
    const fromSelect = document.getElementById('navFrom');
    const toSelect = document.getElementById('navTo');
    const routeResult = document.getElementById('routeResult');

    fromSelect.value = 'entrance';
    toSelect.value = 'mySeat';

    NavEngine.render();

    expect(routeResult.classList.contains('hidden')).toBe(false);
    expect(routeResult.innerHTML).toContain('Enter through Main Entrance');
    expect(routeResult.innerHTML).toContain('Low congestion');
    expect(UIUtils.showToast).toHaveBeenCalled();
  });

  test('render falls back to default route for unknown pairs', () => {
    const fromSelect = document.getElementById('navFrom');
    const toSelect = document.getElementById('navTo');
    const routeResult = document.getElementById('routeResult');

    fromSelect.value = 'gateA';
    toSelect.value = 'foodCourt'; // no explicit mapping for gateA to foodCourt in ROUTES dict

    NavEngine.render();

    expect(routeResult.innerHTML).toContain('Optimal path selected');
    expect(routeResult.innerHTML).toContain('Starting from your current location');
  });
});
