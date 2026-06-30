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
      inputMethod: 'MANUAL',
      summary: '📊 Input 3 Penilaian (manual)\nUH 1, PR 1, Tugas 1',
      detailData: {
        batches: [
          {
            title: 'UH 1 Aljabar',
            grades: { 'f6cfd9be-b8fb-4740-9759-e93b4a2a16d5': '95', 'fb84c4ad-b78f-4100-b6a1-c67d3dfa285d': '88' }
          },
          {
            title: 'PR 1 Fungsi',
            grades: { 'f6cfd9be-b8fb-4740-9759-e93b4a2a16d5': '100', 'fb84c4ad-b78f-4100-b6a1-c67d3dfa285d': '75' }
          }
        ]
      }
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
