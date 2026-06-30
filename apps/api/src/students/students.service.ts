import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async getStudentProfile(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        classStudents: {
          include: {
            class: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Siswa tidak ditemukan');
    }

    const className = student.classStudents[0]?.class.name || 'Belum Terdaftar';

    // 1. Fetch all grades for this student
    const grades = await this.prisma.grade.findMany({
      where: { studentId },
      include: {
        gradeEntry: {
          include: {
            classSubject: {
              include: {
                subject: true,
              },
            },
            category: true,
          },
        },
      },
    });

    // Group grades by subject
    const subjectGradesMap = new Map<string, { subjectName: string; subjectCode: string; totalScore: number; count: number; entries: any[] }>();

    for (const g of grades) {
      const subject = g.gradeEntry.classSubject.subject;
      const key = subject.id;

      const existing = subjectGradesMap.get(key) || {
        subjectName: subject.name,
        subjectCode: subject.code || '',
        totalScore: 0,
        count: 0,
        entries: [],
      };

      if (g.score !== null) {
        existing.totalScore += g.score;
        existing.count++;
      }

      existing.entries.push({
        id: g.id,
        title: g.gradeEntry.title,
        score: g.score,
        maxScore: g.gradeEntry.maxScore,
        date: g.gradeEntry.date?.toISOString() || null,
        category: g.gradeEntry.category?.name || null,
      });

      subjectGradesMap.set(key, existing);
    }

    const gradesSummary = Array.from(subjectGradesMap.values()).map((s) => ({
      subjectName: s.subjectName,
      subjectCode: s.subjectCode,
      averageScore: s.count > 0 ? Math.round((s.totalScore / s.count) * 10) / 10 : 0,
      gradeCount: s.entries.length,
      entries: s.entries,
    }));

    // 2. Fetch attendance history
    const attendances = await this.prisma.attendance.findMany({
      where: { studentId },
    });

    const attendanceSummary = {
      totalDays: attendances.length,
      hadir: attendances.filter((a) => a.status === 'HADIR').length,
      izin: attendances.filter((a) => a.status === 'IZIN').length,
      sakit: attendances.filter((a) => a.status === 'SAKIT').length,
      alpa: attendances.filter((a) => a.status === 'ALPA').length,
    };

    return {
      id: student.id,
      fullName: student.fullName,
      nickname: student.nickname,
      nisn: student.nisn,
      nis: student.nis,
      gender: student.gender,
      photoUrl: student.photoUrl,
      birthDate: student.birthDate?.toISOString() || null,
      birthPlace: student.birthPlace,
      address: student.address,
      fatherName: student.fatherName,
      motherName: student.motherName,
      fatherPhone: student.fatherPhone,
      motherPhone: student.motherPhone,
      className,
      gradesSummary,
      attendanceSummary,
    };
  }
}
