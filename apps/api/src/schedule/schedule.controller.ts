import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('schedule')
export class ScheduleController {
  constructor(private scheduleService: ScheduleService) {}

  @Get()
  async getSchedule(@Req() req: { user: { id: string } }) {
    const data = await this.scheduleService.getTeacherSchedule(req.user.id);
    return {
      success: true,
      data,
    };
  }

  @Post('events')
  async createEvent(
    @Body() body: { title: string; description?: string; eventType: 'MENGAJAR' | 'ULANGAN' | 'RAPAT' | 'DEADLINE' | 'LAINNYA'; startTime: string; endTime?: string },
    @Req() req: { user: { id: string; schoolId: string } },
  ) {
    const data = await this.scheduleService.createEvent({
      ...body,
      schoolId: req.user.schoolId,
      teacherId: req.user.id,
    });
    return {
      success: true,
      data,
    };
  }

  @Delete('events/:id')
  async deleteEvent(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    const result = await this.scheduleService.deleteEvent(id, req.user.id);
    return {
      success: true,
      data: result,
    };
  }
}
