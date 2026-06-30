import { Controller, Post, Body, Get, Param, UseGuards, Req } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('quizzes')
export class QuizzesController {
  constructor(private quizzesService: QuizzesService) {}

  @Post()
  async create(@Body() body: any, @Req() req: { user: { id: string } }) {
    const data = await this.quizzesService.create({
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
    const data = await this.quizzesService.getByClassSubject(classSubjectId);
    return {
      success: true,
      data,
    };
  }

  @Get(':id')
  async getDetail(@Param('id') id: string) {
    const data = await this.quizzesService.getDetail(id);
    return {
      success: true,
      data,
    };
  }

  @Post(':id/publish')
  async publish(@Param('id') id: string) {
    const data = await this.quizzesService.publish(id);
    return {
      success: true,
      data,
    };
  }

  @Post(':id/attempt')
  async submitAttempt(
    @Param('id') id: string,
    @Body('studentId') studentId: string,
    @Body('answers') answers: Array<{ questionId: string; answer: string }>,
  ) {
    const data = await this.quizzesService.submitAttempt(id, studentId, answers);
    return {
      success: true,
      data,
    };
  }

  @Get(':id/results')
  async getQuizResults(@Param('id') id: string) {
    const data = await this.quizzesService.getQuizResults(id);
    return {
      success: true,
      data,
    };
  }
}
