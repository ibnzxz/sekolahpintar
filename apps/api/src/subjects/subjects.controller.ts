import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('subjects')
export class SubjectsController {
  constructor(private subjectsService: SubjectsService) {}

  @Get()
  async getAll(@Req() req: { user: { schoolId: string } }) {
    const data = await this.subjectsService.getAll(req.user.schoolId);
    return {
      success: true,
      data,
    };
  }
}
