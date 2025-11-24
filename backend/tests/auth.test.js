// Simple test example
const request = require('supertest');
const app = require('../src/index');

describe('Health Check', () => {
  it('should return ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Authentication', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'TestPass@123'
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should reject weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'weak'
      });
    
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
  });
});
