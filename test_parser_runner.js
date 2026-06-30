const { parseVoiceInput } = require('./apps/mobile/services/voiceParser.ts'); // Wait, we can't require TS easily

// Let's just create a ts-node script
const fs = require('fs');
const execSync = require('child_process').execSync;

const script = `
import { parseVoiceInput } from './apps/mobile/services/voiceParser';

const students = [
  { id: '1', fullName: 'Bagas', nickname: 'Bagas', nisn: '123', nis: '12', gender: 'L', photoUrl: null },
  { id: '2', fullName: 'Putri', nickname: 'Putri', nisn: '124', nis: '13', gender: 'P', photoUrl: null },
  { id: '3', fullName: 'Kenzo', nickname: 'Kenzo', nisn: '125', nis: '14', gender: 'L', photoUrl: null }
];

console.log(parseVoiceInput('nilai Kenzo 90, Putri 85', students));
console.log(parseVoiceInput('absen semua hadir kecuali Putri izin', students));
`;

fs.writeFileSync('test_parser.ts', script);
try {
  const out = execSync('npx ts-node test_parser.ts', { encoding: 'utf-8' });
  console.log(out);
} catch (e) {
  console.error(e.stdout);
  console.error(e.stderr);
}
