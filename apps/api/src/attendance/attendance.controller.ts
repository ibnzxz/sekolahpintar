import { Controller, Post, Body, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BatchAttendanceRequest } from '@sekolahpintar/shared-types';

@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post()
  async saveBatch(@Body() body: BatchAttendanceRequest, @Req() req: { user: { id: string } }) {
    const result = await this.attendanceService.saveBatch(body, req.user.id);
    return {
      success: true,
      data: result,
    };
  }

  @Get('class/:classId')
  async getAttendance(
    @Param('classId') classId: string,
    @Query('date') date?: string,
  ) {
    if (date) {
      const data = await this.attendanceService.getAttendanceByClassAndDate(classId, date);
      return {
        success: true,
        data,
      };
    } else {
      const data = await this.attendanceService.getClassAttendanceSummary(classId);
      return {
        success: true,
        data,
      };
    }
  }
}
