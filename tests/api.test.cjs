const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../BE/server.js');
let server, base;
before(async () => {
  server = await new Promise(resolve => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));
test('Frontend and API work together on the configured port', async () => {
  const home = await fetch(base);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /login-username/);
  const apiScript = await (await fetch(`${base}/api.js`)).text();
  assert.match(apiScript, /const API_BASE = "\/api"/);
  assert.equal((await fetch(`${base}/api/unknown`)).status, 404);
  assert.equal((await fetch(`${base}/api/surveys`)).status, 401);
  const login = await fetch(`${base}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'password123' }),
  });
  assert.equal(login.status, 200);
  const { access_token } = await login.json();
  const headers = { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' };
  const initial = await (await fetch(`${base}/api/surveys`, { headers })).json();
  const created = await fetch(`${base}/api/surveys`, {
    method: 'POST', headers,
    body: JSON.stringify({ name: 'Smoke test', category: 'intersection', lat: 10.8, lng: 106.7 }),
  });
  assert.equal(created.status, 201);
  const point = await created.json();
  const list = await (await fetch(`${base}/api/surveys`, { headers })).json();
  assert.equal(list.total, initial.total + 1);
  assert.ok(list.data.some(item => item.id === point.id));
  assert.equal((await fetch(`${base}/api/surveys/${point.id}`, { method: 'DELETE', headers })).status, 200);
  const final = await (await fetch(`${base}/api/surveys`, { headers })).json();
  assert.equal(final.total, initial.total);
});
