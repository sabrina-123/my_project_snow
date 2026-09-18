const { expect } = require('chai');
const request = require('supertest');
const app = require('../../app/src/server');

describe('Validation utilisateur', () => {
  it('doit refuser un mot de passe trop court lors de l’inscription', async () => {
    const email = `alice.${Date.now()}@shopnow.test`;

    const res = await request(app)
      .post('/api/register')
      .send({
        firstName: 'Alice',
        lastName: 'Martin',
        email,
        password: '1234'
      });

    expect(res.status).to.equal(400);
    expect(res.body.error).to.equal('Le mot de passe doit contenir au moins 8 caractères');
  });
});
