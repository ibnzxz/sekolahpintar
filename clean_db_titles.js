const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  try {
    const entries = await prisma.gradeEntry.findMany({});
    console.log(`Found ${entries.length} entries. Cleaning...`);
    for (const entry of entries) {
      let cleanTitle = entry.title;
      
      // Find index of first actual letter (A-Z or a-z) to strip emojis safely
      const firstLetterIdx = cleanTitle.search(/[a-zA-Z0-9]/);
      if (firstLetterIdx >= 0) {
        cleanTitle = cleanTitle.substring(firstLetterIdx);
      }
      
      // Split by common separators
      cleanTitle = cleanTitle.split(' — ')[0].trim();
      cleanTitle = cleanTitle.split(' (via ')[0].trim();
      cleanTitle = cleanTitle.split(' (manual')[0].trim();
      
      // Special case mappings if it turns into generic Nilai
      if (cleanTitle.toLowerCase() === 'nilai') {
        cleanTitle = 'Ulangan Harian';
      }
      
      if (cleanTitle !== entry.title) {
        console.log(`Renaming: "${entry.title}" -> "${cleanTitle}"`);
        await prisma.gradeEntry.update({
          where: { id: entry.id },
          data: { title: cleanTitle }
        });
      }
    }
    console.log('Cleanup completed successfully!');
  } catch (e) {
    console.error('Error during cleanup:', e);
  } finally {
    await prisma.$disconnect();
  }
}

clean();
