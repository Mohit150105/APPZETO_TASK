import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../backend/src/config/env';

describe('Unit: Authentication & Cryptography', () => {
  it('should securely hash and verify passwords using bcrypt', async () => {
    const rawPassword = 'SuperSecretPassword123!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    expect(hash).not.toBe(rawPassword);
    expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);

    const isMatch = await bcrypt.compare(rawPassword, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await bcrypt.compare('WrongPassword', hash);
    expect(isWrongMatch).toBe(false);
  });

  it('should sign and verify valid JWT tokens', () => {
    const payload = { id: 'user_123', email: 'test@saas.com', name: 'Dev Tester' };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' });

    const decoded = jwt.verify(token, config.jwtSecret) as any;
    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.name).toBe(payload.name);
  });

  it('should reject tampered or expired JWT tokens', () => {
    const payload = { id: 'user_123' };
    const expiredToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '-1s' });

    expect(() => {
      jwt.verify(expiredToken, config.jwtSecret);
    }).toThrow();

    const wrongSecretToken = jwt.sign(payload, 'wrong_secret_key_999');
    expect(() => {
      jwt.verify(wrongSecretToken, config.jwtSecret);
    }).toThrow();
  });
});
