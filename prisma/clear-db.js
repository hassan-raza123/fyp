const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🧹 Starting database cleanup...');

    // Delete in reverse dependency order to avoid foreign key constraints
    await prisma.obereports.deleteMany();
    await prisma.facultyfeedbacks.deleteMany();
    await prisma.coursefeedbacks.deleteMany();
    await prisma.examattendance.deleteMany();
    await prisma.datesheetentries.deleteMany();
    await prisma.examschedules.deleteMany();
    await prisma.datesheets.deleteMany();
    await prisma.transcripts.deleteMany();
    await prisma.attendances.deleteMany();
    await prisma.timetableslots.deleteMany();
    await prisma.sessions.deleteMany();
    await prisma.detailedresults.deleteMany();
    await prisma.studentassessmentitemresults.deleteMany();
    await prisma.studentassessmentresults.deleteMany();
    await prisma.assessmentitems.deleteMany();
    await prisma.assessments.deleteMany();
    await prisma.cumulativegpa.deleteMany();
    await prisma.semestergpa.deleteMany();
    await prisma.studentgrades.deleteMany();
    await prisma.passfailcriteria.deleteMany();
    await prisma.ploscores.deleteMany();
    await prisma.ploattainments.deleteMany();
    await prisma.closattainments.deleteMany();
    await prisma.cloplomappings.deleteMany();
    await prisma.clos.deleteMany();
    await prisma.plos.deleteMany();
    await prisma.studentsections.deleteMany();
    await prisma.sections.deleteMany();
    await prisma.courseofferings.deleteMany();
    await prisma.faculties.deleteMany();
    await prisma.students.deleteMany();
    await prisma.batches.deleteMany();
    await prisma.semesters.deleteMany();
    await prisma.courses.deleteMany();
    await prisma.programs.deleteMany();
    await prisma.gradescales.deleteMany();
    await prisma.departments.deleteMany();
    await prisma.notifications.deleteMany();
    await prisma.passwordresets.deleteMany();
    await prisma.auditlogs.deleteMany();
    await prisma.userroles.deleteMany();
    await prisma.permissions.deleteMany();
    await prisma.roles.deleteMany();
    await prisma.users.deleteMany();

    console.log('✅ Database cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
