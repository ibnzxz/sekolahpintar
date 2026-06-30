const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reset() {
  try {
    console.log('Resetting all grades...');
    
    // Delete all Grades
    const deletedGrades = await prisma.grade.deleteMany({});
    console.log(`Deleted ${deletedGrades.count} individual Grade records.`);
    
    // Delete all GradeEntries
    const deletedEntries = await prisma.gradeEntry.deleteMany({});
    console.log(`Deleted ${deletedEntries.count} GradeEntry records.`);
    
    // Delete all ActivityLogs of type INPUT_NILAI to clean up chat history
    const deletedLogs = await prisma.activityLog.deleteMany({
      where: { actionType: 'INPUT_NILAI' }
    });
    console.log(`Deleted ${deletedLogs.count} ActivityLog records for grades.`);
    
    console.log('Database reset completed successfully! You can now start with a clean sheet.');
  } catch (e) {
    console.error('Error during reset:', e);
  } finally {
    await prisma.$disconnect();
  }
}

reset();
