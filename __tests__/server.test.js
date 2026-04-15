/**
 * @jest-environment node
 */
const request = require('supertest');
const app = require('../server');

describe('Server Testing', () => {
  it('should serve the fallback index.html for unknown routes', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.statusCode).toEqual(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
  });

  it('should include security headers for efficiency and security', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    // Helmet headers
    expect(res.headers).not.toHaveProperty('x-powered-by'); // Helmet should remove this
    expect(res.headers).toHaveProperty('content-security-policy'); // Our security CSP config should exist
  });

  it('should expose the /api/config route safely', async () => {
    process.env.FIREBASE_API_KEY = 'test_key';
    const res = await request(app).get('/api/config');
    expect(res.statusCode).toEqual(200);
    expect(res.body.firebase.apiKey).toEqual('test_key');
  });
});
