const request = require('supertest');
const { expect } = require('chai');
const app = require('../../app/src/server');

describe('Test API HTTP vers Express / ShopNow', () => {
  it('doit répondre correctement à une requête HTTP sur l’API santé', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).to.have.property('status');
    expect(response.body.status).to.equal('ok');
  });
});
