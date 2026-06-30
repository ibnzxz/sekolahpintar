import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async create(data: { teacherId: string; name: string; templateType: 'NILAI' | 'TUGAS' | 'PENGUMUMAN'; templateData: any }) {
    return this.prisma.inputTemplate.create({
      data: {
        teacherId: data.teacherId,
        name: data.name,
        templateType: data.templateType as any,
        templateData: data.templateData,
      },
    });
  }

  async getByTeacher(teacherId: string) {
    return this.prisma.inputTemplate.findMany({
      where: { teacherId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, teacherId: string, data: { name?: string; templateData?: any }) {
    const template = await this.prisma.inputTemplate.findFirst({
      where: { id, teacherId },
    });

    if (!template) {
      throw new NotFoundException('Template tidak ditemukan');
    }

    return this.prisma.inputTemplate.update({
      where: { id },
      data: {
        name: data.name ?? template.name,
        templateData: data.templateData ?? template.templateData,
      },
    });
  }

  async delete(id: string, teacherId: string) {
    const template = await this.prisma.inputTemplate.findFirst({
      where: { id, teacherId },
    });

    if (!template) {
      throw new NotFoundException('Template tidak ditemukan');
    }

    await this.prisma.inputTemplate.delete({ where: { id } });
    return { success: true };
  }
}
