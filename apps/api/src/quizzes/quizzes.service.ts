import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuizzesService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    classSubjectId?: string;
    teacherId: string;
    title: string;
    description?: string;
    quizType: 'LATIHAN' | 'ULANGAN';
    timeLimitMins?: number;
    shuffleQuestions?: boolean;
    questions: Array<{
      questionText: string;
      questionType: 'PILIHAN_GANDA' | 'ISIAN_SINGKAT';
      options?: string[];
      correctAnswer: string;
      points?: number;
    }>;
  }) {
    const { questions, ...quizData } = data;

    const quiz = await this.prisma.quiz.create({
      data: {
        classSubjectId: quizData.classSubjectId || null,
        teacherId: quizData.teacherId,
        title: quizData.title,
        description: quizData.description || null,
        quizType: quizData.quizType as any,
        timeLimitMins: quizData.timeLimitMins || null,
        shuffleQuestions: quizData.shuffleQuestions || false,
        questions: {
          create: questions.map((q, idx) => ({
            questionText: q.questionText,
            questionType: q.questionType as any,
            options: q.options ? (q.options as any) : undefined,
            correctAnswer: q.correctAnswer,
            points: q.points || 1.0,
            sortOrder: idx,
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    // Create activity log if linked to class
    if (quiz.classSubjectId) {
      const classSubject = await this.prisma.classSubject.findUnique({
        where: { id: quiz.classSubjectId },
        include: { class: true },
      });

      if (classSubject) {
        const typeLabel = quiz.quizType === 'ULANGAN' ? 'Ulangan Resmi' : 'Latihan Mandiri';
        await this.prisma.activityLog.create({
          data: {
            schoolId: classSubject.class.schoolId,
            teacherId: quizData.teacherId,
            classId: classSubject.classId,
            actionType: 'BUAT_KUIS',
            inputMethod: 'MANUAL',
            summary: `❓ Kuis Baru: ${quiz.title}\n📝 Jenis: ${typeLabel} • ${questions.length} Soal`,
            detailData: { quizId: quiz.id, title: quiz.title, type: quiz.quizType },
            referenceType: 'quiz',
            referenceId: quiz.id,
          },
        });
      }
    }

    return quiz;
  }

  async getByClassSubject(classSubjectId: string) {
    const quizzes = await this.prisma.quiz.findMany({
      where: { classSubjectId },
      include: {
        questions: { select: { id: true } },
        attempts: { select: { score: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return quizzes.map((q) => {
      const scores = q.attempts.map((a) => a.score).filter((s): s is number => s !== null);
      const avgScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : null;

      return {
        id: q.id,
        title: q.title,
        description: q.description,
        quizType: q.quizType,
        timeLimitMins: q.timeLimitMins,
        isPublished: q.isPublished,
        questionCount: q.questions.length,
        attemptCount: q.attempts.length,
        averageScore: avgScore !== null ? Math.round(avgScore * 10) / 10 : null,
        createdAt: q.createdAt.toISOString(),
      };
    });
  }

  async getDetail(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { sortOrder: 'asc' } },
        classSubject: { include: { class: true, subject: true } },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Kuis tidak ditemukan');
    }

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      quizType: quiz.quizType,
      timeLimitMins: quiz.timeLimitMins,
      isPublished: quiz.isPublished,
      shuffleQuestions: quiz.shuffleQuestions,
      className: quiz.classSubject?.class.name || '',
      subjectName: quiz.classSubject?.subject.name || '',
      questions: quiz.questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options ? (q.options as string[]) : null,
        points: q.points,
        sortOrder: q.sortOrder,
        imageUrl: q.imageUrl,
      })),
    };
  }

  async publish(id: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id } });
    if (!quiz) throw new NotFoundException('Kuis tidak ditemukan');

    return this.prisma.quiz.update({
      where: { id },
      data: { isPublished: true },
    });
  }

  async submitAttempt(quizId: string, studentId: string, answers: Array<{ questionId: string; answer: string }>) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true, classSubject: true },
    });

    if (!quiz) {
      throw new NotFoundException('Kuis tidak ditemukan');
    }

    // Grade attempt
    let totalPoints = 0;
    let earnedPoints = 0;
    const gradedAnswers = answers.map((ans) => {
      const q = quiz.questions.find((question) => question.id === ans.questionId);
      if (!q) {
        throw new BadRequestException(`Soal dengan ID ${ans.questionId} tidak ditemukan`);
      }
      totalPoints += q.points;
      const isCorrect = q.correctAnswer.trim().toLowerCase() === ans.answer.trim().toLowerCase();
      if (isCorrect) {
        earnedPoints += q.points;
      }
      return {
        questionId: ans.questionId,
        answer: ans.answer,
        isCorrect,
      };
    });

    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quizId,
        studentId,
        score,
        totalPoints,
        completedAt: new Date(),
        answers: gradedAnswers,
      },
    });

    // If quiz is ULANGAN, automatically register a grade entry & grade
    if (quiz.quizType === 'ULANGAN' && quiz.classSubject) {
      // Find or create GradeEntry for this quiz
      let gradeEntryId = quiz.gradeEntryId;
      if (!gradeEntryId) {
        // Find current semester
        const semester = await this.prisma.semester.findFirst({
          where: { isActive: true, academicYear: { schoolId: quiz.classSubject.classId } },
        });

        const entry = await this.prisma.gradeEntry.create({
          data: {
            classSubjectId: quiz.classSubject.id,
            title: `Nilai Kuis: ${quiz.title}`,
            maxScore: 100,
            date: new Date(),
            semesterId: semester?.id || (await this.prisma.semester.findFirst())!.id,
          },
        });

        gradeEntryId = entry.id;

        // Link quiz to grade entry
        await this.prisma.quiz.update({
          where: { id: quizId },
          data: { gradeEntryId },
        });
      }

      // Upsert student grade
      await this.prisma.grade.upsert({
        where: {
          gradeEntryId_studentId: {
            gradeEntryId,
            studentId,
          },
        },
        update: {
          score,
          inputMethod: 'QUIZ',
        },
        create: {
          gradeEntryId,
          studentId,
          score,
          inputMethod: 'QUIZ',
          createdById: quiz.teacherId,
        },
      });
    }

    return {
      attemptId: attempt.id,
      score,
      earnedPoints,
      totalPoints,
    };
  }

  async getQuizResults(quizId: string) {
    const attempts = await this.prisma.quizAttempt.findMany({
      where: { quizId },
      include: { student: { select: { fullName: true, nisn: true } } },
      orderBy: { score: 'desc' },
    });

    return attempts.map((a) => ({
      id: a.id,
      studentId: a.studentId,
      studentName: a.student.fullName,
      nisn: a.student.nisn,
      score: a.score,
      startedAt: a.startedAt.toISOString(),
      completedAt: a.completedAt?.toISOString() || null,
    }));
  }
}
