const request = require('supertest');
const app = require('../src/server');

describe('Server Endpoints', () => {
  it('should serve the frontend index.html', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('VoteWise');
  });

  it('should return 404 for non-existent static files (but serve index.html due to fallback)', async () => {
    const res = await request(app).get('/non-existent-file.txt');
    expect(res.statusCode).toEqual(200); // Because of the wildcard fallback
    expect(res.text).toContain('VoteWise');
  });
});
