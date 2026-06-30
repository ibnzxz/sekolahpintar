const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teachers = await prisma.teacher.findMany();
  console.log('Teachers:');
  console.log(teachers.map(t => ({ id: t.id, name: t.fullName, email: t.email })));

  const classSubjects = await prisma.classSubject.findMany({
    include: { teacher: true, class: true, subject: true }
  });
  console.log('\nClassSubjects:');
  console.log(classSubjects.map(cs => ({
    class: cs.class.name,
    subject: cs.subject.name,
    teacher: cs.teacher?.fullName || 'None'
  })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
