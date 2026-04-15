import { FirebaseService } from '../js/services/firebase.js';

// Mocking fetch 
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ firebase: { apiKey: 'test' } }),
  })
);

describe('FirebaseService', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('should be initially disconnected', () => {
    expect(FirebaseService.isConnected()).toBe(false);
  });

  it('should gracefully fallout to simulation if backend route fails', async () => {
    global.fetch.mockImplementationOnce(() => Promise.resolve({ ok: false }));
    const fallback = jest.fn();
    
    await FirebaseService.connect(fallback);
    expect(FirebaseService.isConnected()).toBe(false);
    expect(fallback).toHaveBeenCalled();
  });

  it('should accept onData callbacks without crashing', () => {
    expect(() => {
      FirebaseService.onData(() => {});
    }).not.toThrow();
  });
});
