import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { InputMethod } from '@prisma/client';

@Injectable()
export class ClassesService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  async getTeacherClasses(teacherId: string) {
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

    const lastLogs = await this.prisma.activityLog.findMany({
      where: { classId: { in: classIds } },
      orderBy: { createdAt: 'desc' },
      include: { teacher: { select: { fullName: true } } },
    });

    const lastLogMap = new Map<string, typeof lastLogs[0]>();
    for (const log of lastLogs) {
      if (log.classId && !lastLogMap.has(log.classId)) {
        lastLogMap.set(log.classId, log);
      }
    }

    return classSubjects.map((cs) => {
      const lastLog = lastLogMap.get(cs.classId);
      return {
        id: cs.class.id,
        name: cs.class.name,
        gradeLevel: cs.class.gradeLevel || 7,
        subjectName: cs.subject.name,
        subjectCode: cs.subject.code || '',
        classSubjectId: cs.id,
        studentCount: cs.class.classStudents.length,
        lastActivity: lastLog
          ? {
              id: lastLog.id,
              actionType: lastLog.actionType,
              inputMethod: lastLog.inputMethod,
              summary: lastLog.summary,
              detailData: lastLog.detailData as Record<string, unknown>,
              referenceType: lastLog.referenceType,
              referenceId: lastLog.referenceId,
              isUndone: lastLog.isUndone,
              teacherName: lastLog.teacher.fullName,
              createdAt: lastLog.createdAt.toISOString(),
            }
          : undefined,
      };
    });
  }

  async getClassDetail(classId: string) {
    const classRecord = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        classStudents: {
          include: { student: true },
        },
        classSubjects: {
          include: { subject: true, teacher: true },
        },
        homeroomTeacher: true,
      },
    });

    if (!classRecord) {
      throw new NotFoundException('Kelas tidak ditemukan');
    }

    return {
      id: classRecord.id,
      name: classRecord.name,
      gradeLevel: classRecord.gradeLevel || 7,
      homeroomTeacher: classRecord.homeroomTeacher
        ? { id: classRecord.homeroomTeacher.id, fullName: classRecord.homeroomTeacher.fullName }
        : undefined,
      subjects: classRecord.classSubjects.map((cs) => ({
        id: cs.id,
        subjectId: cs.subjectId,
        subjectName: cs.subject.name,
        subjectCode: cs.subject.code || '',
        teacherName: cs.teacher.fullName,
        scheduleDay: cs.scheduleDay,
        scheduleTime: cs.scheduleTime,
      })),
      students: classRecord.classStudents.map((cs) => ({
        id: cs.student.id,
        fullName: cs.student.fullName,
        nickname: cs.student.nickname,
        nisn: cs.student.nisn,
        nis: cs.student.nis,
        gender: cs.student.gender,
        photoUrl: cs.student.photoUrl,
      })),
    };
  }

  async getClassActivityLog(classId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where: { classId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { teacher: { select: { fullName: true } } },
      }),
      this.prisma.activityLog.count({ where: { classId } }),
    ]);

    return {
      data: logs.map((log) => ({
        id: log.id,
        actionType: log.actionType,
        inputMethod: log.inputMethod,
        summary: log.summary,
        detailData: log.detailData as Record<string, unknown>,
        referenceType: log.referenceType,
        referenceId: log.referenceId,
        isUndone: log.isUndone,
        teacherName: log.teacher.fullName,
        createdAt: log.createdAt.toISOString(),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async addClassActivity(classId: string, teacherId: string, schoolId: string, payload: any) {
    const log = await this.prisma.activityLog.create({
      data: {
        classId,
        teacherId,
        schoolId,
        actionType: payload.actionType,
        inputMethod: payload.inputMethod || 'MANUAL',
        summary: payload.summary,
        detailData: payload.detailData,
        referenceType: payload.referenceType,
        referenceId: payload.referenceId,
      },
      include: {
        teacher: { select: { fullName: true } },
      },
    });

    try {
      if (payload.actionType === 'INPUT_NILAI') {
        let classSubject: any = null;
        const reqClassSubjectId = payload.detailData?.classSubjectId;
        if (reqClassSubjectId) {
          classSubject = await this.prisma.classSubject.findUnique({
            where: { id: reqClassSubjectId },
          });
        }
        if (!classSubject) {
          classSubject = await this.prisma.classSubject.findFirst({
            where: { classId, teacherId },
          });
        }

        let semester = await this.prisma.semester.findFirst({
          where: { academicYear: { schoolId }, isActive: true },
        });
        if (!semester) {
          semester = await this.prisma.semester.findFirst();
        }

        if (classSubject && semester) {
          const batches = payload.detailData?.batches;
          if (Array.isArray(batches)) {
            const batchPromises = batches.map(async (batch) => {
              let targetTitle = batch.title || 'Nilai (Otomatis)';

              const firstLetterIdx = targetTitle.search(/[a-zA-Z0-9]/);
              if (firstLetterIdx >= 0) {
                targetTitle = targetTitle.substring(firstLetterIdx);
              }
              targetTitle = targetTitle.split(' — ')[0].trim();
              targetTitle = targetTitle.split(' - ')[0].trim();
              targetTitle = targetTitle.split(' (via ')[0].trim();
              targetTitle = targetTitle.split(' (manual')[0].trim();

              let gradeEntry = await this.prisma.gradeEntry.findFirst({
                where: {
                  classSubjectId: classSubject.id,
                  semesterId: semester.id,
                  title: { equals: targetTitle, mode: 'insensitive' }
                }
              });

              if (!gradeEntry) {
                gradeEntry = await this.prisma.gradeEntry.create({
                  data: {
                    classSubjectId: classSubject.id,
                    semesterId: semester.id,
                    title: targetTitle,
                    maxScore: 100,
                    date: new Date(),
                  },
                });
              }

              const gradesData = batch.grades;
              if (gradesData && typeof gradesData === 'object') {
                const upsertPromises = Object.keys(gradesData).map((studentId) => {
                  const score = parseFloat(gradesData[studentId]) || 0;
                  const inputMethod = payload.inputMethod === 'VOICE' ? 'VOICE' as InputMethod : 'MANUAL' as InputMethod;
                  return this.prisma.grade.upsert({
                    where: {
                      gradeEntryId_studentId: {
                        gradeEntryId: gradeEntry.id,
                        studentId,
                      }
                    },
                    update: { score, inputMethod, createdById: teacherId },
                    create: {
                      gradeEntryId: gradeEntry.id,
                      studentId,
                      score,
                      inputMethod,
                      createdById: teacherId,
                    }
                  });
                });
                await Promise.all(upsertPromises);
              }
            });
            await Promise.all(batchPromises);
          } else if (payload.detailData?.grades) {
            let targetTitle = payload.detailData?.assessmentTitle || payload.summary.split('\n')[0] || 'Nilai (Otomatis)';

            const firstLetterIdx = targetTitle.search(/[a-zA-Z0-9]/);
            if (firstLetterIdx >= 0) {
              targetTitle = targetTitle.substring(firstLetterIdx);
            }
            targetTitle = targetTitle.split(' — ')[0].trim();
            targetTitle = targetTitle.split(' - ')[0].trim();
            targetTitle = targetTitle.split(' (via ')[0].trim();
            targetTitle = targetTitle.split(' (manual')[0].trim();

            let gradeEntry = await this.prisma.gradeEntry.findFirst({
              where: {
                classSubjectId: classSubject.id,
                semesterId: semester.id,
                title: { equals: targetTitle, mode: 'insensitive' }
              }
            });

            if (!gradeEntry) {
              gradeEntry = await this.prisma.gradeEntry.create({
                data: {
                  classSubjectId: classSubject.id,
                  semesterId: semester.id,
                  title: targetTitle,
                  maxScore: 100,
                  date: new Date(),
                },
              });
            }

            const gradesData = payload.detailData.grades;
            const inputMethod = payload.inputMethod === 'VOICE' ? 'VOICE' as InputMethod : 'MANUAL' as InputMethod;

            if (Array.isArray(gradesData)) {
              const upsertPromises = gradesData.map((g) => {
                const score = parseFloat(g.score) || 0;
                return this.prisma.grade.upsert({
                  where: {
                    gradeEntryId_studentId: {
                      gradeEntryId: gradeEntry.id,
                      studentId: g.studentId,
                    }
                  },
                  update: { score, inputMethod, createdById: teacherId },
                  create: {
                    gradeEntryId: gradeEntry.id,
                    studentId: g.studentId,
                    score,
                    inputMethod,
                    createdById: teacherId,
                  }
                });
              });
              await Promise.all(upsertPromises);
            } else if (typeof gradesData === 'object') {
              const upsertPromises = Object.keys(gradesData).map((studentId) => {
                const score = parseFloat(gradesData[studentId]) || 0;
                return this.prisma.grade.upsert({
                  where: {
                    gradeEntryId_studentId: {
                      gradeEntryId: gradeEntry.id,
                      studentId,
                    }
                  },
                  update: { score, inputMethod, createdById: teacherId },
                  create: {
                    gradeEntryId: gradeEntry.id,
                    studentId,
                    score,
                    inputMethod,
                    createdById: teacherId,
                  }
                });
              });
              await Promise.all(upsertPromises);
            }
          }
        }
      }
      else if (payload.actionType === 'INPUT_ABSENSI' && payload.detailData) {
        let attendanceData: { studentId: string, status: string }[] = [];

        if (payload.detailData.attendance) {
          const dict = payload.detailData.attendance;
          attendanceData = Object.keys(dict).map(studentId => ({
            studentId,
            status: dict[studentId]
          }));
        } else if (payload.detailData.exceptions) {
          const classStudents = await this.prisma.classStudent.findMany({
            where: { classId },
            select: { studentId: true }
          });
          const exc: { studentId: string, status: string }[] = payload.detailData.exceptions;
          const excMap = new Map(exc.map((e) => [e.studentId, e.status]));

          attendanceData = classStudents.map(cs => ({
            studentId: cs.studentId,
            status: excMap.get(cs.studentId) || 'HADIR'
          }));
        }

        if (attendanceData.length > 0) {
          const insertData = attendanceData.map(a => ({
            classId,
            studentId: a.studentId,
            createdById: teacherId,
            date: new Date(),
            status: a.status as any,
            inputMethod: payload.inputMethod === 'VOICE' ? 'VOICE' as InputMethod : 'MANUAL' as InputMethod,
          }));
          await this.prisma.attendance.createMany({ data: insertData });
        }
      }
    } catch (err) {
      console.error('Error saving actual data for activity', err);
    }

    const result = {
      id: log.id,
      actionType: log.actionType,
      inputMethod: log.inputMethod,
      summary: log.summary,
      detailData: log.detailData as Record<string, unknown>,
      referenceType: log.referenceType,
      referenceId: log.referenceId,
      isUndone: log.isUndone,
      teacherName: log.teacher.fullName,
      createdAt: log.createdAt.toISOString(),
    };

    this.events.notifyClassActivity(classId, result);

    return result;
  }
}
