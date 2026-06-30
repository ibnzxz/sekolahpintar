import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getTeacherAnalytics(teacherId: string) {
    const classSubjects = await this.prisma.classSubject.findMany({
      where: { teacherId },
      include: {
        class: {
          include: {
            classStudents: { select: { studentId: true } },
          },
        },
        subject: true,
      },
    });

    const classIds = classSubjects.map((cs) => cs.classId);
    const classSubjectIds = classSubjects.map((cs) => cs.id);

    const totalClasses = classIds.length;
    const studentIdsSet = new Set<string>();
    for (const cs of classSubjects) {
      for (const s of cs.class.classStudents) {
        studentIdsSet.add(s.studentId);
      }
    }
    const totalStudents = studentIdsSet.size;

    const [allGrades, allAttendances, studentsData] = await Promise.all([
      this.prisma.grade.findMany({
        where: { gradeEntry: { classSubjectId: { in: classSubjectIds } } },
        include: { gradeEntry: { select: { classSubjectId: true } } },
      }),
      this.prisma.attendance.findMany({
        where: { classId: { in: classIds } },
      }),
      this.prisma.student.findMany({
        where: { id: { in: Array.from(studentIdsSet) } },
        include: {
          classStudents: { include: { class: true } },
          grades: {
            where: { gradeEntry: { classSubjectId: { in: classSubjectIds } } },
          },
          attendances: {
            where: { classId: { in: classIds } },
          },
        },
      }),
    ]);

    const validScores = allGrades.map((g) => g.score).filter((s): s is number => s !== null);
    const averageGrade = validScores.length > 0 ? validScores.reduce((sum, s) => sum + s, 0) / validScores.length : 0;

    const totalAttendanceCount = allAttendances.length;
    const presentCount = allAttendances.filter((a) => a.status === 'HADIR').length;
    const attendanceRate = totalAttendanceCount > 0 ? (presentCount / totalAttendanceCount) * 100 : 100;

    const classStats = classSubjects.map((cs) => {
      const classGrades = allGrades.filter((g) => g.gradeEntry?.classSubjectId === cs.id);
      const classScores = classGrades.map((g) => g.score).filter((s): s is number => s !== null);
      const classAvgGrade = classScores.length > 0 ? classScores.reduce((sum, s) => sum + s, 0) / classScores.length : 0;

      const classAttendance = allAttendances.filter((a) => a.classId === cs.classId);
      const classTotalAtt = classAttendance.length;
      const classPresentAtt = classAttendance.filter((a) => a.status === 'HADIR').length;
      const classAttRate = classTotalAtt > 0 ? (classPresentAtt / classTotalAtt) * 100 : 100;

      return {
        classId: cs.classId,
        className: cs.class.name,
        subjectName: cs.subject.name,
        studentCount: cs.class.classStudents.length,
        averageGrade: Math.round(classAvgGrade * 10) / 10,
        attendanceRate: Math.round(classAttRate * 10) / 10,
      };
    });

    const studentsAtRisk: any[] = [];

    for (const student of studentsData) {
      const className = student.classStudents[0]?.class.name || '';

      const scores = student.grades.map((g) => g.score).filter((s): s is number => s !== null);
      const studentAvg = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : null;

      const studentAtt = student.attendances;
      const attRate = studentAtt.length > 0
        ? (studentAtt.filter((a) => a.status === 'HADIR').length / studentAtt.length) * 100
        : 100;

      const isLowGrade = studentAvg !== null && studentAvg < 70;
      const isLowAttendance = attRate < 85;

      if (isLowGrade || isLowAttendance) {
        let reason = '';
        if (isLowGrade && isLowAttendance) {
          reason = 'Nilai di bawah rata-rata & absensi rendah';
        } else if (isLowGrade) {
          reason = 'Nilai di bawah rata-rata';
        } else {
          reason = 'Absensi rendah';
        }

        studentsAtRisk.push({
          studentId: student.id,
          studentName: student.fullName,
          className,
          averageGrade: studentAvg !== null ? Math.round(studentAvg * 10) / 10 : 0,
          attendanceRate: Math.round(attRate * 10) / 10,
          reason,
        });
      }
    }

    return {
      totalStudents,
      totalClasses,
      averageGrade: Math.round(averageGrade * 10) / 10,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
      classStats,
      studentsAtRisk: studentsAtRisk.slice(0, 10),
    };
  }
}
