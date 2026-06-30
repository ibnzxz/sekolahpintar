import { Controller, Post, Body, Get, Param, Delete, UseGuards, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MaterialsService } from './materials.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import * as path from 'path';

const s3Config = new S3Client({
  region: process.env.S3_REGION || 'auto',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
  endpoint: process.env.S3_ENDPOINT, // e.g. for Cloudflare R2
});

@UseGuards(JwtAuthGuard)
@Controller('materials')
export class MaterialsController {
  constructor(private materialsService: MaterialsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multerS3({
        s3: s3Config,
        bucket: process.env.S3_BUCKET || 'uploads',
        acl: 'public-read',
        metadata: function (req, file, cb) {
          cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `materials/${uniqueSuffix}${path.extname(file.originalname)}`);
        }
      }),
    }),
  )
  async create(
    @UploadedFile() file: any,
    @Body('classSubjectId') classSubjectId: string,
    @Body('title') title: string,
    @Body('description') description: string,
    @Req() req: { user: { id: string } },
  ) {
    const fileUrl = file ? (file as any).location : undefined;
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

    return {
      success: true,
      data,
    };
  }

  @Get('class-subject/:classSubjectId')
  async getByClassSubject(@Param('classSubjectId') classSubjectId: string) {
    const data = await this.materialsService.getByClassSubject(classSubjectId);
    return {
      success: true,
      data,
    };
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    const result = await this.materialsService.delete(id, req.user.id);
    return {
      success: true,
      data: result,
    };
  }
}
