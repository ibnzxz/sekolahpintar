import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async updatePreferences(teacherId: string, preferences: any) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Guru tidak ditemukan');
    }

    const currentPreferences = typeof teacher.preferences === 'string'
      ? JSON.parse(teacher.preferences)
      : (teacher.preferences as Record<string, any>) || {};

    const updatedPreferences = {
      ...currentPreferences,
      ...preferences,
    };

    return this.prisma.teacher.update({
      where: { id: teacherId },
      data: {
        preferences: updatedPreferences,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        preferences: true,
      },
    });
  }

  async getMyClasses(teacherId: string) {
    const classSubjects = await this.prisma.classSubject.findMany({
      where: { teacherId },
      include: {
        class: {
          include: {
            _count: {
              select: { classStudents: true }
            }
          }
        },
        subject: true
      }
    });

    return classSubjects.map(cs => ({
      id: cs.classId, // using classId as id for mobile app compatibility
      name: cs.class.name,
      subjectName: cs.subject.name,
      subjectCode: cs.subject.code,
      studentCount: cs.class._count.classStudents,
    }));
  }
}
