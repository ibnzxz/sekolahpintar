import { Controller, Post, Body, Get, Param, Delete, UseGuards, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { MaterialsService } from './materials.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import * as path from 'path';

const uploadDir = process.env.UPLOAD_DIR || path.resolve(__dirname, '..', '..', 'uploads');

@UseGuards(JwtAuthGuard)
@Controller('materials')
export class MaterialsController {
  constructor(private materialsService: MaterialsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: path.join(uploadDir, 'materials'),
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10) },
    }),
  )
  async create(
    @UploadedFile() file: any,
    @Body('classSubjectId') classSubjectId: string,
    @Body('title') title: string,
    @Body('description') description: string,
    @Req() req: { user: { id: string } },
  ) {
    const fileUrl = file ? `/uploads/materials/${file.filename}` : undefined;
    const fileType = file ? path.extname(file.originalname).substring(1) : undefined;
    const fileSize = file ? file.size : undefined;

    const data = await this.materialsService.create({
      classSubjectId,
      teacherId: req.user.id,
      title,
      description,
      fileUrl,
      fileType,
      fileSize,
    });

    return { success: true, data };
  }

  @Get('class-subject/:classSubjectId')
  async getByClassSubject(@Param('classSubjectId') classSubjectId: string) {
    const data = await this.materialsService.getByClassSubject(classSubjectId);
    return { success: true, data };
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    const result = await this.materialsService.delete(id, req.user.id);
    return { success: true, data: result };
  }
}
