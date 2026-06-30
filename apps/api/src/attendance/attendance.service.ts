import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BatchAttendanceRequest, AttendanceStatus } from '@sekolahpintar/shared-types';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async saveBatch(request: BatchAttendanceRequest, teacherId: string) {
    const { classId, date, inputMethod, attendances } = request;

    // Verify class exists
    const classRecord = await this.prisma.class.findUnique({
      where: { id: classId },
      include: { school: true },
    });

    if (!classRecord) {
      throw new NotFoundException('Kelas tidak ditemukan');
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0); // normalize date to midnight local/UTC

    const result = await this.prisma.$transaction(async (tx) => {
      // Save all attendance records using upsert
      const savedRecords = await Promise.all(
        attendances.map(async (att) => {
          return tx.attendance.upsert({
            where: {
              classId_studentId_date: {
                classId,
                studentId: att.studentId,
                date: attendanceDate,
              },
            },
            update: {
              status: att.status as any,
              notes: att.notes || null,
              inputMethod: inputMethod as any,
              createdById: teacherId,
            },
            create: {
              classId,
              studentId: att.studentId,
              date: attendanceDate,
              status: att.status as any,
              notes: att.notes || null,
              inputMethod: inputMethod as any,
              createdById: teacherId,
            },
            include: {
              student: { select: { fullName: true } },
            },
          });
        }),
      );

      // Calculate stats for the summary
      let hadir = 0;
      let izin = 0;
      let sakit = 0;
      let alpa = 0;
      const exceptionDetails: string[] = [];

      for (const record of savedRecords) {
        if (record.status === 'HADIR') hadir++;
        else if (record.status === 'IZIN') {
          izin++;
          exceptionDetails.push(`${record.student.fullName} (Izin)`);
        } else if (record.status === 'SAKIT') {
          sakit++;
          exceptionDetails.push(`${record.student.fullName} (Sakit)`);
        } else if (record.status === 'ALPA') {
          alpa++;
          exceptionDetails.push(`${record.student.fullName} (Alpa)`);
        }
      }

      // Format date for summary, e.g., "29 Juni 2026"
      const formattedDate = attendanceDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      let exceptionsSummary = '';
      if (exceptionDetails.length > 0) {
        exceptionsSummary = `\nKecuali: ${exceptionDetails.join(', ')}`;
      }

      const inputLabel = inputMethod === 'VOICE' ? 'suara' : 'manual';
      const summaryText = `📋 Absensi ${formattedDate}\n✅ ${hadir} hadir | 📝 ${izin} izin | 🏥 ${sakit} sakit | ❌ ${alpa} alpa (via ${inputLabel})${exceptionsSummary}`;

      // Create ActivityLog (Chat bubble)
      const log = await tx.activityLog.create({
        data: {
          schoolId: classRecord.schoolId,
          teacherId,
          classId,
          actionType: 'INPUT_ABSENSI',
          inputMethod: inputMethod as any,
          summary: summaryText,
          detailData: {
            date: attendanceDate.toISOString(),
            hadir,
            izin,
            sakit,
            alpa,
            total: attendances.length,
          },
          referenceType: 'attendance',
        },
      });

      return { count: savedRecords.length, stats: { hadir, izin, sakit, alpa }, logId: log.id };
    });

    return result;
  }

  async getAttendanceByClassAndDate(classId: string, dateStr: string) {
    const attendanceDate = new Date(dateStr);
    attendanceDate.setHours(0, 0, 0, 0);

    const records = await this.prisma.attendance.findMany({
      where: {
        classId,
        date: attendanceDate,
      },
      include: {
        student: { select: { fullName: true } },
      },
    });

    return records.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      studentName: r.student.fullName,
      status: r.status,
      notes: r.notes,
      date: r.date.toISOString(),
      inputMethod: r.inputMethod,
    }));
  }

  async getClassAttendanceSummary(classId: string) {
    const records = await this.prisma.attendance.findMany({
      where: { classId },
      include: { student: { select: { fullName: true } } },
    });

    // Group by student
    const studentMap = new Map<string, { studentName: string; hadir: number; izin: number; sakit: number; alpa: number }>();

    for (const r of records) {
      const existing = studentMap.get(r.studentId) || {
        studentName: r.student.fullName,
        hadir: 0,
        izin: 0,
        sakit: 0,
        alpa: 0,
      };

      if (r.status === 'HADIR') existing.hadir++;
      else if (r.status === 'IZIN') existing.izin++;
      else if (r.status === 'SAKIT') existing.sakit++;
      else if (r.status === 'ALPA') existing.alpa++;

      studentMap.set(r.studentId, existing);
    }

    return Array.from(studentMap.entries()).map(([studentId, stats]) => ({
      studentId,
      ...stats,
      totalDays: stats.hadir + stats.izin + stats.sakit + stats.alpa,
    }));
  }
}
