const fetch = require('node-fetch');

async function main() {
  // Test with the teacher who logged in
  // First, let's see which teacher is logged in by testing a few
  const teachers = [
    { email: 'sambalroaaa@gmail.com', name: 'Christopher Brilliant' },
    { email: 'merliawati26@gmail.com', name: 'Merliawati' },
    { email: 'biber@sekolah.com', name: 'Admin SD BINA BERSAMA' },
  ];

  for (const t of teachers) {
    console.log(`\n=== Testing ${t.name} (${t.email}) ===`);
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: t.email, password: 'guru123' })
    });
    const loginData = await loginRes.json();
    if (!loginData.success) {
      console.log('Login failed');
      continue;
    }
    
    const token = loginData.data.accessToken;
    const classesRes = await fetch('http://localhost:3000/api/teachers/my-classes', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const classesData = await classesRes.json();
    console.log('Classes:', JSON.stringify(classesData.data?.map(c => `${c.name} - ${c.subjectName}`) || classesData, null, 2));
  }
}

main();
