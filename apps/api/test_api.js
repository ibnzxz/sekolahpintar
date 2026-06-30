const fetch = require('node-fetch'); // Or use native fetch if Node 18+
async function run() {
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'merliawati26@gmail.com', password: 'guru123' })
  });
  const loginJson = await loginRes.json();
  console.log('Login:', loginJson);

  if (loginJson.success) {
    const token = loginJson.data.accessToken;

    const classesRes = await fetch('http://localhost:3000/api/classes/6639cc01-6e02-44ea-931c-d4d43d89b3d7', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const classesJson = await classesRes.json();
    console.log('ClassDetail:', classesJson);
  }
}
run();
