const fetch = require('node-fetch');

async function run() {
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'merliawati26@gmail.com', password: 'guru123' })
  });
  const loginJson = await loginRes.json();
  if (loginJson.success) {
    const token = loginJson.data.accessToken;

    const payload = {
      actionType: 'INPUT_NILAI',
      inputMethod: 'VOICE',
      summary: 'Test summary',
      detailData: { grades: [{ studentId: '123', studentName: 'Kenzo', score: 90 }] }
    };

    const res = await fetch('http://localhost:3000/api/classes/6639cc01-6e02-44ea-931c-d4d43d89b3d7/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Status:', res.status);
    const json = await res.json();
    console.log('Response:', json);
  }
}
run();
