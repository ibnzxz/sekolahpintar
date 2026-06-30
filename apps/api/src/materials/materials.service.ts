import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    classSubjectId: string;
    teacherId: string;
    title: string;
    description?: string;
    fileUrl?: string;
    fileType?: string;
    fileSize?: number;
  }) {
    const classSubject = await this.prisma.classSubject.findUnique({
      where: { id: data.classSubjectId },
      include: { class: true },
    });

    if (!classSubject) {
      throw new NotFoundException('Kelas mata pelajaran tidak ditemukan');
    }

    const material = await this.prisma.material.create({
      data: {
        classSubjectId: data.classSubjectId,
        teacherId: data.teacherId,
        title: data.title,
        description: data.description || null,
        fileUrl: data.fileUrl || null,
        fileType: data.fileType || null,
        fileSize: data.fileSize ? BigInt(data.fileSize) : null,
      },
    });

    // Create chat bubble
    const typeLabel = data.fileType ? data.fileType.toUpperCase() : 'FILE';
    await this.prisma.activityLog.create({
      data: {
        schoolId: classSubject.class.schoolId,
        teacherId: data.teacherId,
        classId: classSubject.classId,
        actionType: 'UPLOAD_MATERI',
        inputMethod: 'MANUAL',
        summary: `📚 Materi Baru: ${data.title}\n📎 ${typeLabel} ${data.description ? `• ${data.description}` : ''}`,
        detailData: { materialId: material.id, title: data.title },
        referenceType: 'material',
        referenceId: material.id,
      },
    });

    return {
      ...material,
      fileSize: material.fileSize ? Number(material.fileSize) : null,
    };
  }

  async getByClassSubject(classSubjectId: string) {
    const materials = await this.prisma.material.findMany({
      where: { classSubjectId },
      include: {
        teacher: { select: { fullName: true } },
        classSubject: { include: { subject: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return materials.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      fileUrl: m.fileUrl,
      fileType: m.fileType,
      fileSize: m.fileSize ? Number(m.fileSize) : null,
      teacherName: m.teacher.fullName,
      subjectName: m.classSubject.subject.name,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  async delete(id: string, teacherId: string) {
    const material = await this.prisma.material.findUnique({
      where: { id },
      include: { classSubject: { include: { class: true } } },
    });

    if (!material) {
      throw new NotFoundException('Materi tidak ditemukan');
    }

    await this.prisma.material.delete({ where: { id } });

    // Hapus file fisik
    if (material.fileUrl) {
      const filePath = path.resolve(__dirname, '..', '..', '..', material.fileUrl.replace(/^\//, ''));
      try { fs.unlinkSync(filePath); } catch {}
    }

    await this.prisma.activityLog.updateMany({
      where: { referenceType: 'material', referenceId: id },
      data: { isUndone: true },
    });

    return { success: true };
  }
}
