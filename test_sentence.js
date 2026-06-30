const { parseVoiceInput } = require('./apps/mobile/services/voiceParser');

const students = [
  { id: '1', fullName: 'Kenzo Aditya Pratama', nickname: 'Kenzo' }
];

const result = parseVoiceInput("PR 2nz 95", students);
console.log('Result:', result);
if (
  result.intent === 'INPUT_NILAI' && 
  result.grades && 
  result.grades[0].score === 95 && 
  result.grades[0].studentName === 'Kenzo Aditya Pratama' &&
  result.assessmentTitle === 'PR 2'
) {
  console.log('Test PASSED!');
  process.exit(0);
} else {
  console.log('Test FAILED!');
  process.exit(1);
}
