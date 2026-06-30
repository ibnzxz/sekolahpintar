import { Controller, Post, Body, Get, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('assignments')
export class AssignmentsController {
  constructor(private assignmentsService: AssignmentsService) {}

  @Post()
  async create(
    @Body() body: { classSubjectId: string; title: string; description?: string; dueDate?: string; attachmentUrl?: string; inputMethod?: string },
    @Req() req: { user: { id: string } },
  ) {
    const data = await this.assignmentsService.create({
      ...body,
      teacherId: req.user.id,
    });
    return {
      success: true,
      data,
    };
  }

  @Get('class-subject/:classSubjectId')
  async getByClassSubject(@Param('classSubjectId') classSubjectId: string) {
    const data = await this.assignmentsService.getByClassSubject(classSubjectId);
    return {
      success: true,
      data,
    };
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    const result = await this.assignmentsService.delete(id, req.user.id);
    return {
      success: true,
      data: result,
    };
  }
}
