import { Controller, Post, Body, Get, Put, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  @Post()
  async create(
    @Body() body: { name: string; templateType: 'NILAI' | 'TUGAS' | 'PENGUMUMAN'; templateData: any },
    @Req() req: { user: { id: string } },
  ) {
    const data = await this.templatesService.create({
      ...body,
      teacherId: req.user.id,
    });
    return {
      success: true,
      data,
    };
  }

  @Get()
  async getByTeacher(@Req() req: { user: { id: string } }) {
    const data = await this.templatesService.getByTeacher(req.user.id);
    return {
      success: true,
      data,
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; templateData?: any },
    @Req() req: { user: { id: string } },
  ) {
    const data = await this.templatesService.update(id, req.user.id, body);
    return {
      success: true,
      data,
    };
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    const result = await this.templatesService.delete(id, req.user.id);
    return {
      success: true,
      data: result,
    };
  }
}
