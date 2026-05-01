const request = require('supertest');
const app = require('../src/server');

describe('Chat API Endpoint', () => {
  it('should return 500 if NVIDIA_API_KEY is missing', async () => {
    // Save original key
    const originalKey = process.env.NVIDIA_API_KEY;
    delete process.env.NVIDIA_API_KEY;

    const res = await request(app)
      .post('/api/chat')
      .send({ messages: [], context: {} });

    expect(res.statusCode).toEqual(500);
    expect(res.body.error).toContain('NVIDIA_API_KEY');

    // Restore original key
    process.env.NVIDIA_API_KEY = originalKey;
  });

  it('should handle missing messages and context gracefully', async () => {
    // This will likely try to call the NVIDIA API if the key is present
    // but we can test the initial validation logic if any.
    // For now, let's just check if it returns 200 (SSE starts) when key is present.
    if (process.env.NVIDIA_API_KEY) {
      const res = await request(app)
        .post('/api/chat')
        .send({});
      
      expect(res.header['content-type']).toContain('text/event-stream');
    }
  });
});
