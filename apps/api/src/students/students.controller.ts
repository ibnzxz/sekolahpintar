import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('students')
export class StudentsController {
  constructor(private studentsService: StudentsService) {}

  @Get(':id')
  async getStudentProfile(@Param('id') id: string) {
    const data = await this.studentsService.getStudentProfile(id);
    return {
      success: true,
      data,
    };
  }
}
