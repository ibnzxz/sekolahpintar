import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActionType, InputMethod } from '@sekolahpintar/shared-types';

@Injectable()
export class ActivityLogService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    schoolId: string;
    teacherId: string;
    classId?: string;
    actionType: ActionType;
    inputMethod: InputMethod;
    summary: string;
    detailData?: Record<string, unknown>;
    referenceType?: string;
    referenceId?: string;
  }) {
    return this.prisma.activityLog.create({
      data: {
        schoolId: params.schoolId,
        teacherId: params.teacherId,
        classId: params.classId || null,
        actionType: params.actionType as any,
        inputMethod: params.inputMethod as any,
        summary: params.summary,
        detailData: params.detailData ? (params.detailData as any) : undefined,
        referenceType: params.referenceType || null,
        referenceId: params.referenceId || null,
      },
    });
  }
}
