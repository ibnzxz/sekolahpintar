import { Controller, Get, Param, UseGuards, Req, Post, Body, Query } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('classes')
export class ClassesController {
  constructor(private classesService: ClassesService) {}

  @Get()
  async getTeacherClasses(@Req() req: { user: { id: string } }) {
    const data = await this.classesService.getTeacherClasses(req.user.id);
    return {
      success: true,
      data,
    };
  }

  @Get(':id')
  async getClassDetail(@Param('id') id: string) {
    const data = await this.classesService.getClassDetail(id);
    return {
      success: true,
      data,
    };
  }

  @Get(':id/activities')
  async getClassActivityLog(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    const data = await this.classesService.getClassActivityLog(id, page, limit);
    return {
      success: true,
      data: data.data,
      meta: data.meta,
    };
  }

  @Post(':id/activities')
  async addClassActivity(
    @Param('id') id: string,
    @Req() req: { user: { id: string; schoolId: string } },
    @Body() payload: any,
  ) {
    const data = await this.classesService.addClassActivity(
      id,
      req.user.id,
      req.user.schoolId,
      payload
    );
    return {
      success: true,
      data,
    };
  }
}
