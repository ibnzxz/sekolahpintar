import { Controller, Post, Body, Put, Param, Delete, Get, UseGuards, Req, Query } from '@nestjs/common';
import { GradesService } from './grades.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BatchGradeRequest } from '@sekolahpintar/shared-types';

@UseGuards(JwtAuthGuard)
@Controller('grades')
export class GradesController {
  constructor(private gradesService: GradesService) {}

  @Post()
  async createBatch(@Body() body: BatchGradeRequest, @Req() req: { user: { id: string } }) {
    const result = await this.gradesService.createBatch(body, req.user.id);
    return {
      success: true,
      data: result,
    };
  }

  @Get('class-subject/:classSubjectId')
  async getGradesByClass(
    @Param('classSubjectId') classSubjectId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    const data = await this.gradesService.getGradesByClass(classSubjectId, page, limit);
    return {
      success: true,
      data: data.data,
      meta: data.meta,
    };
  }

  @Put(':id')
  async updateGrade(
    @Param('id') id: string,
    @Body('score') score: number,
    @Body('notes') notes: string,
    @Req() req: { user: { id: string } },
  ) {
    const data = await this.gradesService.updateGrade(id, score, notes, req.user.id);
    return {
      success: true,
      data,
    };
  }

  @Delete('entry/:entryId')
  async undoGradeEntry(@Param('entryId') entryId: string, @Req() req: { user: { id: string } }) {
    const result = await this.gradesService.undoGradeEntry(entryId, req.user.id);
    return {
      success: true,
      data: result,
    };
  }
}
