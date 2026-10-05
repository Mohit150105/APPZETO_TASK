import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { setupTestDB, app, createTestUser } from '../setup';

describe('Integration: Authentication APIs', () => {
  setupTestDB();

  it('POST /api/auth/register creates user and returns JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe('jane@example.com');
    expect(res.body.data.user.name).toBe('Jane Doe');
    expect(res.body.data.user.passwordHash).toBeUndefined(); // Password hash never leaked
    expect(res.body.data.token).toBeDefined();
  });

  it('POST /api/auth/register rejects duplicate email address', async () => {
    await createTestUser('duplicate@example.com');

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Another User',
        email: 'duplicate@example.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('POST /api/auth/login authenticates valid user', async () => {
    // Password123!
    await createTestUser('login@example.com');

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('login@example.com');
  });

  it('POST /api/auth/login rejects invalid password', async () => {
    await createTestUser('login_fail@example.com');

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login_fail@example.com',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('GET /api/auth/me returns profile for authenticated user', async () => {
    const { token } = await createTestUser('me@example.com');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('me@example.com');
    expect(Array.isArray(res.body.data.organizations)).toBe(true);
  });

  it('GET /api/auth/me rejects unauthenticated request', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
