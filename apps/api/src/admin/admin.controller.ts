import { Controller, Post, Body, Get, Put, Delete, Param, Query, UseGuards, Req, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TeacherRole } from '@sekolahpintar/db';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ──────────────────────────────
  // SUPER ADMIN ENDPOINTS (SCHOOLS)
  // ──────────────────────────────

  @Get('schools')
  @Roles('SUPER_ADMIN')
  async getSchools() {
    const data = await this.adminService.getSchools();
    return { success: true, data };
  }

  @Post('schools')
  @Roles('SUPER_ADMIN')
  async createSchool(@Body() body: any) {
    const data = await this.adminService.createSchool(body);
    return { success: true, data };
  }

  // ──────────────────────────────
  // GET LISTS
  // ──────────────────────────────

  @Get('students')
  async getStudents(
    @Req() req: { user: { schoolId: string } },
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    const { data, meta } = await this.adminService.getStudents(req.user.schoolId, page, limit);
    return { success: true, data, meta };
  }

  @Get('students/template')
  async downloadStudentTemplate(@Res() res: Response) {
    const buffer = await this.adminService.generateStudentTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Template_Data_Siswa.xlsx');
    res.send(buffer);
  }

  @Get('teachers')
  async getTeachers(
    @Req() req: { user: { schoolId: string } },
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    const { data, meta } = await this.adminService.getTeachers(req.user.schoolId, page, limit);
    return { success: true, data, meta };
  }

  @Get('classes')
  async getClasses(
    @Req() req: { user: { schoolId: string } },
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    const { data, meta } = await this.adminService.getClasses(req.user.schoolId, page, limit);
    return { success: true, data, meta };
  }

  @Get('subjects')
  async getSubjects(
    @Req() req: { user: { schoolId: string } },
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    const { data, meta } = await this.adminService.getSubjects(req.user.schoolId, page, limit);
    return { success: true, data, meta };
  }

  // Students CRUD
  @Post('students')
  async createStudent(@Body() body: any, @Req() req: { user: { schoolId: string } }) {
    const data = await this.adminService.createStudent(req.user.schoolId, body);
    return { success: true, data };
  }

  @Put('students/:id')
  async updateStudent(@Param('id') id: string, @Body() body: any) {
    const data = await this.adminService.updateStudent(id, body);
    return { success: true, data };
  }

  @Delete('students/:id')
  async deleteStudent(@Param('id') id: string) {
    const data = await this.adminService.deleteStudent(id);
    return { success: true, data };
  }

  @Delete('students')
  async deleteAllStudents(@Req() req: { user: { schoolId: string } }) {
    const data = await this.adminService.deleteAllStudents(req.user.schoolId);
    return { success: true, data };
  }

  @Post('students/import')
  @UseInterceptors(FileInterceptor('file'))
  async importStudents(@UploadedFile() file: any, @Req() req: { user: { schoolId: string } }) {
    if (!file) {
      return { success: false, message: 'File tidak ditemukan' };
    }
    
    const isExcel = file.originalname?.endsWith('.xlsx') || file.originalname?.endsWith('.xls') || file.mimetype?.includes('sheet') || file.mimetype?.includes('excel');
    
    if (isExcel) {
      const result = await this.adminService.importStudentsExcel(req.user.schoolId, file.buffer);
      return { success: true, data: result };
    } else {
      const csvContent = file.buffer.toString();
      const result = await this.adminService.importStudentsCsv(req.user.schoolId, csvContent);
      return { success: true, data: result };
    }
  }

  // Teachers CRUD
  @Post('teachers/import')
  @UseInterceptors(FileInterceptor('file'))
  async importTeachers(@UploadedFile() file: any, @Req() req: { user: { schoolId: string } }) {
    if (!file) {
      return { success: false, message: 'File tidak ditemukan' };
    }

    const isExcel = file.originalname?.endsWith('.xlsx') || file.originalname?.endsWith('.xls') || file.mimetype?.includes('sheet') || file.mimetype?.includes('excel');
    
    if (isExcel) {
      const result = await this.adminService.importTeachersExcel(req.user.schoolId, file.buffer);
      return { success: true, data: result };
    } else {
      return { success: false, message: 'Format file tidak didukung. Silakan gunakan format Excel (.xlsx)' };
    }
  }

  @Post('teachers')
  async createTeacher(@Body() body: any, @Req() req: { user: { schoolId: string } }) {
    const data = await this.adminService.createTeacher(req.user.schoolId, body);
    return { success: true, data };
  }

  @Put('teachers/:id')
  async updateTeacher(@Param('id') id: string, @Body() body: any) {
    const data = await this.adminService.updateTeacher(id, body);
    return { success: true, data };
  }

  @Post('teachers/:id/reset-password')
  async resetTeacherPassword(@Param('id') id: string) {
    const data = await this.adminService.resetTeacherPassword(id);
    return { success: true, data };
  }

  // Classes CRUD
  @Post('classes')
  async createClass(@Body() body: any, @Req() req: { user: { schoolId: string } }) {
    const data = await this.adminService.createClass(req.user.schoolId, body);
    return { success: true, data };
  }

  @Put('classes/:id')
  async updateClass(@Param('id') id: string, @Body() body: any) {
    const data = await this.adminService.updateClass(id, body);
    return { success: true, data };
  }

  @Post('classes/:id/students')
  async assignStudent(@Param('id') classId: string, @Body('studentId') studentId: string) {
    const data = await this.adminService.assignStudentToClass(classId, studentId);
    return { success: true, data };
  }

  @Post('classes/:id/subjects')
  async assignSubject(@Param('id') classId: string, @Body('subjectId') subjectId: string, @Body('teacherId') teacherId: string) {
    const data = await this.adminService.assignSubjectToClass(classId, subjectId, teacherId);
    return { success: true, data };
  }

  @Delete('classes/:id/subjects/:subjectId')
  async removeSubject(@Param('id') classId: string, @Param('subjectId') subjectId: string) {
    const data = await this.adminService.removeClassSubject(classId, subjectId);
    return { success: true, data };
  }

  @Get('class-subjects')
  async getAllClassSubjects(@Req() req: { user: { schoolId: string } }) {
    const data = await this.adminService.getAllClassSubjects(req.user.schoolId);
    return { success: true, data };
  }

  // Subjects CRUD
  @Post('subjects')
  async createSubject(@Body() body: any, @Req() req: { user: { schoolId: string } }) {
    const data = await this.adminService.createSubject(req.user.schoolId, body);
    return { success: true, data };
  }

  @Put('subjects/:id')
  async updateSubject(@Param('id') id: string, @Body() body: any) {
    const data = await this.adminService.updateSubject(id, body);
    return { success: true, data };
  }

  @Delete('subjects/:id')
  async deleteSubject(@Param('id') id: string) {
    const data = await this.adminService.deleteSubject(id);
    return { success: true, data };
  }

  // Reports
  @Get('reports/grades')
  async getGradesReport(@Query('classSubjectId') classSubjectId: string) {
    const data = await this.adminService.getGradesReport(classSubjectId);
    return { success: true, data };
  }

  @Get('reports/attendance')
  async getAttendanceReport(
    @Query('classId') classId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const data = await this.adminService.getAttendanceReport(classId, startDate, endDate);
    return { success: true, data };
  }
}
