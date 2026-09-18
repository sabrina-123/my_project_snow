const request = require('supertest');
const { expect } = require('chai');
const app = require('../../app/src/server');

describe('API - exemple de test', () => {
  it('démarre et arrête le serveur sur un port disponible', async () => {
    const server = app.startServer(0);

    await new Promise((resolve) => server.once('listening', resolve));
    expect(server.address().port).to.be.greaterThan(0);

    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    expect(server.listening).to.equal(false);
  });

  it('GET / doit servir la page d accueil', async () => {
    const res = await request(app).get('/');

    expect(res.status).to.equal(200);
    expect(res.type).to.equal('text/html');
  });

  it('sert la page d accueil pour une route frontend inconnue', async () => {
    const res = await request(app).get('/page-inconnue');

    expect(res.status).to.equal(200);
    expect(res.type).to.equal('text/html');
  });

  it('GET /api/health doit retourner 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal('ok');
  });

  it('retourne la liste des produits avec une entrée valide', async () => {
    const res = await request(app).get('/api/products');

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array').that.is.not.empty;
    expect(res.body[0]).to.include.all.keys('id', 'name', 'price');
  });

  it('retourne un produit pour un identifiant valide', async () => {
    const res = await request(app).get('/api/products/1');

    expect(res.status).to.equal(200);
    expect(res.body.id).to.equal(1);
    expect(res.body.name).to.equal('Laptop Pro 14"');
  });

  it('refuse un identifiant de produit inexistant', async () => {
    const res = await request(app).get('/api/products/999');

    expect(res.status).to.equal(404);
    expect(res.body.error).to.equal('Produit introuvable');
  });

  it('refuse un paramètre de produit invalide', async () => {
    const res = await request(app).get('/api/products/abc');

    expect(res.status).to.equal(404);
    expect(res.body.error).to.equal('Produit introuvable');
  });

  it('retourne 404 pour une route API inexistante', async () => {
    const res = await request(app).get('/api/unknown');

    expect(res.status).to.equal(404);
  });

  it('accepte les identifiants valides lors de la connexion', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'student@shopnow.test', password: 'Password123!' });

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal('Connexion réussie');
    expect(res.body.user.email).to.equal('student@shopnow.test');
  });

  it('refuse une mauvaise donnée lors de la connexion', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'student@shopnow.test', password: 'wrong-password' });

    expect(res.status).to.equal(401);
    expect(res.body.error).to.equal('Email ou mot de passe incorrect');
  });

  it('refuse un paramètre absent lors de la connexion', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'student@shopnow.test' });

    expect(res.status).to.equal(401);
    expect(res.body).to.have.property('error');
  });

  it('refuse une adresse email vide lors de la connexion', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: '', password: 'Password123!' });

    expect(res.status).to.equal(401);
    expect(res.body.error).to.equal('Email ou mot de passe incorrect');
  });

  it('accepte une adresse email sans tenir compte de la casse', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'STUDENT@SHOPNOW.TEST', password: 'Password123!' });

    expect(res.status).to.equal(200);
    expect(res.body.user.email).to.equal('student@shopnow.test');
  });

  it('refuse un champ obligatoire absent à l inscription', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        firstName: 'Alice',
        lastName: 'Martin',
        password: 'Password123!'
      });

    expect(res.status).to.equal(400);
    expect(res.body.error).to.equal('Tous les champs sont obligatoires');
  });

  it('refuse une inscription sans prénom', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        lastName: 'Martin',
        email: `missing-first-name.${Date.now()}@shopnow.test`,
        password: 'Password123!'
      });

    expect(res.status).to.equal(400);
    expect(res.body.error).to.equal('Tous les champs sont obligatoires');
  });

  it('refuse une inscription sans nom', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        firstName: 'Alice',
        email: `missing-last-name.${Date.now()}@shopnow.test`,
        password: 'Password123!'
      });

    expect(res.status).to.equal(400);
    expect(res.body.error).to.equal('Tous les champs sont obligatoires');
  });

  it('refuse une inscription sans mot de passe', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        firstName: 'Alice',
        lastName: 'Martin',
        email: `missing-password.${Date.now()}@shopnow.test`
      });

    expect(res.status).to.equal(400);
    expect(res.body.error).to.equal('Tous les champs sont obligatoires');
  });

  it('accepte un mot de passe à la longueur minimale de 8 caractères', async () => {
    const email = `minimum.${Date.now()}@shopnow.test`;
    const res = await request(app)
      .post('/api/register')
      .send({
        firstName: 'Alice',
        lastName: 'Martin',
        email,
        password: '12345678'
      });

    expect(res.status).to.equal(201);
    expect(res.body.user.email).to.equal(email);
  });

  it('refuse une inscription avec un email déjà utilisé', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        firstName: 'Another',
        lastName: 'Student',
        email: 'student@shopnow.test',
        password: 'Password123!'
      });

    expect(res.status).to.equal(409);
    expect(res.body).to.have.property('error');
  });
});
