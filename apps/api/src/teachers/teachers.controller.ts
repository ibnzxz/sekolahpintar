import { Controller, Put, Body, UseGuards, Req, Get } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('teachers')
export class TeachersController {
  constructor(private teachersService: TeachersService) {}

  @Put('preferences')
  async updatePreferences(
    @Body() preferences: any,
    @Req() req: { user: { id: string } },
  ) {
    const data = await this.teachersService.updatePreferences(req.user.id, preferences);
    return {
      success: true,
      data,
    };
  }

  @Get('my-classes')
  async getMyClasses(@Req() req: any) {
    console.log('[DEBUG] req.user =', JSON.stringify(req.user));
    const teacherId = req.user?.id;
    if (!teacherId) {
      return { success: true, data: [] };
    }
    const data = await this.teachersService.getMyClasses(teacherId);
    return {
      success: true,
      data,
    };
  }
}
