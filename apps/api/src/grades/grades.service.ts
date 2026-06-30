import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BatchGradeRequest, InputMethod } from '@sekolahpintar/shared-types';

@Injectable()
export class GradesService {
  constructor(private prisma: PrismaService) {}

  async createBatch(request: BatchGradeRequest, teacherId: string) {
    const {
      classSubjectId,
      semesterId,
      categoryId,
      title,
      maxScore = 100,
      date = new Date().toISOString(),
      inputMethod,
      grades,
    } = request;

    const classSubject = await this.prisma.classSubject.findUnique({
      where: { id: classSubjectId },
      include: { class: true, subject: true },
    });

    if (!classSubject) {
      throw new NotFoundException('Kelas mata pelajaran tidak ditemukan');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const entry = await tx.gradeEntry.create({
        data: {
          classSubjectId,
          categoryId: categoryId || null,
          semesterId,
          title,
          maxScore,
          date: new Date(date),
        },
      });

      const createdGrades = await Promise.all(
        grades.map(async (g) => {
          return tx.grade.create({
            data: {
              gradeEntryId: entry.id,
              studentId: g.studentId,
              score: g.score,
              notes: g.notes || null,
              inputMethod: inputMethod as any,
              createdById: teacherId,
            },
          });
        }),
      );

      const validScores = grades.map((g) => g.score).filter((s) => s !== null && s !== undefined);
      const avgScore = validScores.length > 0 ? validScores.reduce((sum, s) => sum + s, 0) / validScores.length : 0;
      const roundedAvg = Math.round(avgScore * 10) / 10;

      const inputLabel = inputMethod === 'VOICE' ? 'suara' : 'manual';
      const log = await tx.activityLog.create({
        data: {
          schoolId: classSubject.class.schoolId,
          teacherId,
          classId: classSubject.classId,
          actionType: 'INPUT_NILAI',
          inputMethod: inputMethod as any,
          summary: `Nilai ${title}\n${grades.length} siswa dinilai (via ${inputLabel})\nRata-rata: ${roundedAvg}`,
          detailData: {
            gradeEntryId: entry.id,
            count: grades.length,
            average: roundedAvg,
            title,
          },
          referenceType: 'grade_entry',
          referenceId: entry.id,
        },
      });

      return { entry, gradesCount: createdGrades.length, average: roundedAvg, logId: log.id };
    });

    return result;
  }

  async getGradesByClass(classSubjectId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
      this.prisma.gradeEntry.findMany({
        where: { classSubjectId },
        include: {
          grades: {
            include: {
              student: {
                select: { id: true, fullName: true, nickname: true },
              },
            },
          },
          category: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.gradeEntry.count({ where: { classSubjectId } }),
    ]);

    return {
      data: entries.map((entry) => ({
        id: entry.id,
        title: entry.title,
        date: entry.date?.toISOString(),
        category: entry.category?.name || null,
        maxScore: entry.maxScore,
        grades: entry.grades.map((g) => ({
          id: g.id,
          studentId: g.studentId,
          studentName: g.student.fullName,
          score: g.score,
          notes: g.notes,
          inputMethod: g.inputMethod,
          createdAt: g.createdAt.toISOString(),
        })),
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateGrade(id: string, score: number, notes?: string, teacherId?: string) {
    const grade = await this.prisma.grade.findUnique({
      where: { id },
      include: { gradeEntry: { include: { classSubject: { include: { class: true } } } } },
    });

    if (!grade) {
      throw new NotFoundException('Data nilai tidak ditemukan');
    }

    const updated = await this.prisma.grade.update({
      where: { id },
      data: { score, notes: notes || null },
    });

    if (teacherId) {
      await this.prisma.activityLog.create({
        data: {
          schoolId: grade.gradeEntry.classSubject.class.schoolId,
          teacherId,
          classId: grade.gradeEntry.classSubject.classId,
          actionType: 'EDIT_NILAI',
          inputMethod: 'MANUAL',
          summary: `Mengubah nilai siswa untuk ${grade.gradeEntry.title}`,
          detailData: { gradeId: id, oldScore: grade.score, newScore: score },
          referenceType: 'grade',
          referenceId: id,
        },
      });
    }

    return updated;
  }

  async undoGradeEntry(entryId: string, teacherId: string) {
    const entry = await this.prisma.gradeEntry.findUnique({
      where: { id: entryId },
      include: { classSubject: { include: { class: true } } },
    });

    if (!entry) {
      throw new NotFoundException('Data entri nilai tidak ditemukan');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.grade.deleteMany({ where: { gradeEntryId: entryId } });
      await tx.gradeEntry.delete({ where: { id: entryId } });
      await tx.activityLog.updateMany({
        where: { referenceType: 'grade_entry', referenceId: entryId },
        data: { isUndone: true },
      });
      await tx.activityLog.create({
        data: {
          schoolId: entry.classSubject.class.schoolId,
          teacherId,
          classId: entry.classSubject.classId,
          actionType: 'UNDO',
          inputMethod: 'MANUAL',
          summary: `Membatalkan entri nilai: ${entry.title}`,
          detailData: { gradeEntryId: entryId, title: entry.title },
          referenceType: 'grade_entry',
          referenceId: entryId,
        },
      });
    });

    return { success: true };
  }
}
