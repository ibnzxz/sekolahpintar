import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssignmentsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    classSubjectId: string;
    teacherId: string;
    title: string;
    description?: string;
    dueDate?: string;
    attachmentUrl?: string;
    inputMethod?: string;
  }) {
    const classSubject = await this.prisma.classSubject.findUnique({
      where: { id: data.classSubjectId },
      include: { class: true },
    });

    if (!classSubject) {
      throw new NotFoundException('Kelas mata pelajaran tidak ditemukan');
    }

    const assignment = await this.prisma.assignment.create({
      data: {
        classSubjectId: data.classSubjectId,
        teacherId: data.teacherId,
        title: data.title,
        description: data.description || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        attachmentUrl: data.attachmentUrl || null,
        inputMethod: (data.inputMethod || 'MANUAL') as any,
      },
    });

    // Create chat bubble log
    const dateStr = data.dueDate
      ? new Date(data.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })
      : 'secepatnya';

    const inputLabel = data.inputMethod === 'VOICE' ? 'suara' : 'manual';

    await this.prisma.activityLog.create({
      data: {
        schoolId: classSubject.class.schoolId,
        teacherId: data.teacherId,
        classId: classSubject.classId,
        actionType: 'BUAT_TUGAS',
        inputMethod: (data.inputMethod || 'MANUAL') as any,
        summary: `📝 Tugas Baru: ${data.title}\n📅 Batas Pengumpulan: ${dateStr} (via ${inputLabel})`,
        detailData: { assignmentId: assignment.id, title: data.title, dueDate: data.dueDate },
        referenceType: 'assignment',
        referenceId: assignment.id,
      },
    });

    return assignment;
  }

  async getByClassSubject(classSubjectId: string) {
    const assignments = await this.prisma.assignment.findMany({
      where: { classSubjectId },
      include: {
        teacher: { select: { fullName: true } },
        classSubject: { include: { subject: true } },
        submissions: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch total students in class to show "N/M submitted"
    const classSubject = await this.prisma.classSubject.findUnique({
      where: { id: classSubjectId },
      include: { class: { include: { classStudents: true } } },
    });
    const totalStudents = classSubject?.class.classStudents.length || 0;

    return assignments.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      attachmentUrl: a.attachmentUrl,
      dueDate: a.dueDate ? a.dueDate.toISOString() : null,
      teacherName: a.teacher.fullName,
      subjectName: a.classSubject.subject.name,
      submissionCount: a.submissions.length,
      totalStudents,
      createdAt: a.createdAt.toISOString(),
    }));
  }

  async delete(id: string, teacherId: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: { classSubject: { include: { class: true } } },
    });

    if (!assignment) {
      throw new NotFoundException('Tugas tidak ditemukan');
    }

    await this.prisma.assignment.delete({ where: { id } });

    // Mark log as undone
    await this.prisma.activityLog.updateMany({
      where: { referenceType: 'assignment', referenceId: id },
      data: { isUndone: true },
    });

    return { success: true };
  }
}
