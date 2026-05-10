import { describe, it, expect } from 'vitest';
import { GET } from './check';

describe('Alerts Check API - Basic Tests', () => {
  it('should be defined and export a GET function', () => {
    expect(GET).toBeDefined();
    expect(typeof GET).toBe('function');
  });

  it('should have the correct function signature', () => {
    // The GET function should be an async function that takes a context parameter
    expect(GET.constructor.name).toBe('AsyncFunction');
  });
});