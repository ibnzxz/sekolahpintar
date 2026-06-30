import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  async getTeacherSchedule(teacherId: string) {
    // 1. Fetch class schedule based on ClassSubjects taught by this teacher
    const classSubjects = await this.prisma.classSubject.findMany({
      where: { teacherId },
      include: {
        class: true,
        subject: true,
      },
    });

    const recurringEvents = classSubjects.map((cs) => ({
      id: `schedule-${cs.id}`,
      title: `Mengajar ${cs.subject.name} - Kelas ${cs.class.name}`,
      description: `Jadwal mengajar kelas ${cs.class.name}`,
      eventType: 'MENGAJAR',
      scheduleDay: cs.scheduleDay,
      startTime: cs.scheduleTime || '07:30',
      endTime: cs.scheduleEndTime || '09:00',
      isRecurring: true,
      className: cs.class.name,
      subjectName: cs.subject.name,
    }));

    // 2. Fetch specific schedule events (Rapat, Ulangan, Deadline, etc.)
    const events = await this.prisma.scheduleEvent.findMany({
      where: {
        OR: [
          { teacherId },
          { teacherId: null }, // school-wide events
        ],
      },
      include: {
        school: true,
      },
    });

    const specificEvents = events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      eventType: e.eventType,
      startTime: e.startTime.toISOString(),
      endTime: e.endTime?.toISOString() || null,
      isRecurring: e.isRecurring,
    }));

    return [...recurringEvents, ...specificEvents];
  }

  async createEvent(data: {
    schoolId: string;
    teacherId?: string;
    title: string;
    description?: string;
    eventType: 'MENGAJAR' | 'ULANGAN' | 'RAPAT' | 'DEADLINE' | 'LAINNYA';
    startTime: string;
    endTime?: string;
  }) {
    return this.prisma.scheduleEvent.create({
      data: {
        schoolId: data.schoolId,
        teacherId: data.teacherId || null,
        title: data.title,
        description: data.description || null,
        eventType: data.eventType as any,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
      },
    });
  }

  async deleteEvent(id: string, teacherId: string) {
    const event = await this.prisma.scheduleEvent.findFirst({
      where: { id, teacherId },
    });

    if (!event) {
      throw new NotFoundException('Event tidak ditemukan');
    }

    await this.prisma.scheduleEvent.delete({ where: { id } });
    return { success: true };
  }
}
