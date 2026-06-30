import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseVoiceCommand } from '@sekolahpintar/voice-parser';

@Injectable()
export class VoiceService {
  constructor(private prisma: PrismaService) {}

  async parseCommand(text: string, classId: string, subjectId?: string) {
    // 1. Fetch class details & students
    const classRecord = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        classStudents: {
          include: {
            student: {
              select: { id: true, fullName: true, nickname: true },
            },
          },
        },
      },
    });

    if (!classRecord) {
      throw new NotFoundException('Kelas tidak ditemukan');
    }

    // 2. Fetch subject details if subjectId is provided
    let subjectName: string | undefined;
    if (subjectId) {
      const subject = await this.prisma.subject.findUnique({
        where: { id: subjectId },
      });
      subjectName = subject?.name;
    }

    // Map students to structure expected by parser
    const students = classRecord.classStudents.map((cs) => ({
      id: cs.student.id,
      fullName: cs.student.fullName,
      nickname: cs.student.nickname,
    }));

    // 3. Call parser
    const result = parseVoiceCommand(text, {
      students,
      className: classRecord.name,
      subjectName,
    });

    return result;
  }
}
