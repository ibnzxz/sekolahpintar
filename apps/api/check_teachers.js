const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teachers = await prisma.teacher.findMany();
  for (const t of teachers) {
    const cs = await prisma.classSubject.findMany({ where: { teacherId: t.id }});
    console.log(`Teacher ${t.fullName} (${t.email}) has ${cs.length} subjects`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
