import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { parse } from 'csv-parse/sync';
import * as ExcelJS from 'exceljs';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  private hashLegacyPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private async comparePassword(password: string, hash: string): Promise<boolean> {
    if (hash.startsWith('$2')) {
      return bcrypt.compare(password, hash);
    }
    const legacyHash = this.hashLegacyPassword(password);
    return hash === legacyHash || hash === password;
  }

  // ──────────────────────────────
  // SUPER ADMIN (SCHOOLS)
  // ──────────────────────────────

  async getSchools() {
    return this.prisma.school.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { teachers: true, students: true, classes: true }
        }
      }
    });
  }

  async createSchool(data: any) {
    const existingSchool = await this.prisma.school.findFirst({ where: { npsn: data.npsn } });
    if (existingSchool) {
      throw new BadRequestException(`Sekolah dengan NPSN ${data.npsn} sudah terdaftar.`);
    }

    const school = await this.prisma.school.create({
      data: {
        name: data.name,
        npsn: data.npsn,
        city: data.city,
        status: data.status || 'NEGERI',
        level: data.level || 'SMP',
      }
    });

    if (data.adminEmail) {
      const passwordHash = await this.hashPassword(data.adminPassword || 'admin123');
      await this.prisma.teacher.create({
        data: {
          schoolId: school.id,
          fullName: `Admin ${data.name}`,
          email: data.adminEmail,
          passwordHash,
          role: 'ADMIN',
          isActive: true,
        }
      });
    }

    return school;
  }

  // ──────────────────────────────
  // GET LISTS
  // ──────────────────────────────

  async getStudents(schoolId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where: { schoolId },
        orderBy: { fullName: 'asc' },
        skip,
        take: limit,
        include: {
          classStudents: { include: { class: true } },
        },
      }),
      this.prisma.student.count({ where: { schoolId } }),
    ]);

    return {
      data: students.map((s) => {
        const { classStudents, ...rest } = s;
        return {
          ...rest,
          className: classStudents.length > 0 ? classStudents[0].class.name : '-',
        };
      }),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getTeachers(schoolId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [teachers, total] = await Promise.all([
      this.prisma.teacher.findMany({
        where: { schoolId },
        orderBy: { fullName: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.teacher.count({ where: { schoolId } }),
    ]);
    return { data: teachers, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getClasses(schoolId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [classes, total] = await Promise.all([
      this.prisma.class.findMany({
        where: { schoolId },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
        include: { homeroomTeacher: true },
      }),
      this.prisma.class.count({ where: { schoolId } }),
    ]);
    return { data: classes, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getSubjects(schoolId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [subjects, total] = await Promise.all([
      this.prisma.subject.findMany({
        where: { schoolId },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.subject.count({ where: { schoolId } }),
    ]);
    return { data: subjects, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  // ──────────────────────────────
  // STUDENT CRUD
  // ──────────────────────────────

  async createStudent(schoolId: string, data: any) {
    return this.prisma.student.create({
      data: {
        schoolId,
        nisn: data.nisn || null,
        nis: data.nis || null,
        nik: data.nik || null,
        fullName: data.fullName,
        nickname: data.nickname || null,
        gender: data.gender || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        birthPlace: data.birthPlace || null,
        religion: data.religion || null,
        address: data.address || null,
        fatherName: data.fatherName || null,
        motherName: data.motherName || null,
        fatherPhone: data.fatherPhone || null,
        motherPhone: data.motherPhone || null,
        entryYear: data.entryYear ? parseInt(data.entryYear, 10) : null,
      },
    });
  }

  async updateStudent(id: string, data: any) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Siswa tidak ditemukan');

    return this.prisma.student.update({
      where: { id },
      data: {
        nisn: data.nisn !== undefined ? data.nisn : student.nisn,
        nis: data.nis !== undefined ? data.nis : student.nis,
        nik: data.nik !== undefined ? data.nik : student.nik,
        fullName: data.fullName !== undefined ? data.fullName : student.fullName,
        nickname: data.nickname !== undefined ? data.nickname : student.nickname,
        gender: data.gender !== undefined ? data.gender : student.gender,
        birthDate: data.birthDate !== undefined ? (data.birthDate ? new Date(data.birthDate) : null) : student.birthDate,
        birthPlace: data.birthPlace !== undefined ? data.birthPlace : student.birthPlace,
        religion: data.religion !== undefined ? data.religion : student.religion,
        address: data.address !== undefined ? data.address : student.address,
        fatherName: data.fatherName !== undefined ? data.fatherName : student.fatherName,
        motherName: data.motherName !== undefined ? data.motherName : student.motherName,
        fatherPhone: data.fatherPhone !== undefined ? data.fatherPhone : student.fatherPhone,
        motherPhone: data.motherPhone !== undefined ? data.motherPhone : student.motherPhone,
      },
    });
  }

  async deleteStudent(id: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Siswa tidak ditemukan');
    await this.prisma.student.delete({ where: { id } });
    return { success: true };
  }

  async deleteAllStudents(schoolId: string) {
    const result = await this.prisma.student.deleteMany({ where: { schoolId } });
    return { success: true, count: result.count };
  }

  async importStudentsCsv(schoolId: string, csvContent: string) {
    try {
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      const imported: any[] = [];
      for (const record of records) {
        if (!record.fullName) continue;

        const student = await this.prisma.student.create({
          data: {
            schoolId,
            fullName: record.fullName,
            nickname: record.nickname || null,
            nisn: record.nisn || null,
            nis: record.nis || null,
            gender: record.gender || null,
            birthPlace: record.birthPlace || null,
            birthDate: record.birthDate ? new Date(record.birthDate) : null,
            fatherName: record.fatherName || null,
            motherName: record.motherName || null,
          },
        });
        imported.push(student);
      }

      return { count: imported.length, students: imported };
    } catch (e: any) {
      throw new BadRequestException(`Gagal memproses CSV: ${e.message}`);
    }
  }

  async generateStudentTemplate() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Data Siswa');

    sheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Nama Lengkap', key: 'fullName', width: 30 },
      { header: 'NIS (Induk)', key: 'nis', width: 15 },
      { header: 'Jenis Kelamin (L/P)', key: 'gender', width: 20 },
      { header: 'NISN', key: 'nisn', width: 15 },
      { header: 'Tempat Lahir', key: 'birthPlace', width: 20 },
      { header: 'Tanggal Lahir', key: 'birthDate', width: 25 },
      { header: 'Agama', key: 'religion', width: 15 },
      { header: 'Nama Ayah', key: 'fatherName', width: 25 },
      { header: 'Nama Ibu', key: 'motherName', width: 25 },
      { header: 'Kelas', key: 'className', width: 10 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    sheet.addRow({
      no: 1,
      fullName: 'Budi Santoso',
      nis: '2023001',
      gender: 'L',
      nisn: '0012345678',
      birthPlace: 'Jakarta',
      birthDate: '25-08-2010',
      religion: 'Islam',
      fatherName: 'Bambang',
      motherName: 'Siti',
      className: '7A',
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  async importStudentsExcel(schoolId: string, buffer: any) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const sheet = workbook.worksheets[0];
      
      const imported: any[] = [];
      let headerRowIndex = 5;
      let headerRow5: ExcelJS.Row | null = null;
      let headerRow4: ExcelJS.Row | null = null;
      
      for (let i = 1; i <= 10; i++) {
        const row = sheet.getRow(i);
        const rowValues = row.values;
        if (Array.isArray(rowValues) && rowValues.includes('NISN')) {
          headerRowIndex = i;
          headerRow5 = row;
          headerRow4 = sheet.getRow(i - 1);
          break;
        }
      }

      const colMap = new Map<string, number>();
      if (headerRow5) {
        let lastVal4 = '';
        const maxCol = sheet.columnCount || 100;
        for (let col = 1; col <= maxCol; col++) {
          let cell4Val = '';
          if (headerRow4) {
            const cell4 = headerRow4.getCell(col).value;
            if (cell4) {
              cell4Val = String(cell4).trim().toLowerCase();
              lastVal4 = cell4Val;
            }
          }
          
          const cell5 = headerRow5.getCell(col).value;
          const val5 = cell5 ? String(cell5).trim().toLowerCase() : '';
          
          if (val5) {
            colMap.set(val5, col);
            if (lastVal4) {
              colMap.set(`${lastVal4} ${val5}`, col);
            }
          }
        }
      }

      const getColIndex = (keywords: string[], defaultIdx: number) => {
        for (const kw of keywords) {
          for (const [key, val] of colMap.entries()) {
            if (key.includes(kw)) return val;
          }
        }
        return defaultIdx;
      };

      const colNama = getColIndex(['nama', 'peserta didik'], 2);
      const colNis = getColIndex(['nipd', 'nis', 'induk'], 3);
      const colJk = getColIndex(['jk', 'kelamin'], 4);
      const colNisn = getColIndex(['nisn'], 5);
      const colTmpLahir = getColIndex(['tempat lahir'], 6);
      const colTglLahir = getColIndex(['tanggal lahir', 'tgl lahir'], 7);
      const colAgama = getColIndex(['agama', 'kepercayaan'], 8);
      const colAyah = getColIndex(['ayah kandung nama', 'nama ayah'], 25);
      const colIbu = getColIndex(['ibu kandung nama', 'nama ibu'], 31);
      const colRombel = getColIndex(['rombel', 'rombongan belajar', 'kelas'], 44);

      const classes = await this.prisma.class.findMany({ where: { schoolId } });
      const classMap = new Map<string, string>();
      classes.forEach((c) => classMap.set(c.name, c.id));

      const existingStudents = await this.prisma.student.findMany({
        where: { schoolId },
        select: { id: true, fullName: true, nisn: true }
      });
      const studentMapByNisn = new Map<string, string>();
      const studentMapByName = new Map<string, string>();
      existingStudents.forEach(s => {
        if (s.nisn) studentMapByNisn.set(s.nisn, s.id);
        studentMapByName.set(s.fullName.toLowerCase(), s.id);
      });

      let academicYear = await this.prisma.academicYear.findFirst({
        where: { schoolId, isActive: true },
      });
      if (!academicYear) {
        academicYear = await this.prisma.academicYear.create({
          data: {
            schoolId,
            name: '2025/2026',
            startDate: new Date('2025-07-01'),
            endDate: new Date('2026-06-30'),
            isActive: true,
          },
        });
      }

      const classesToCreate: any[] = [];
      const studentsToCreate: any[] = [];
      const studentsToUpdate: any[] = [];
      const classStudentsToCreate: any[] = [];

      const totalRows = sheet.rowCount;
      for (let i = headerRowIndex + 1; i <= totalRows; i++) {
        const row = sheet.getRow(i);
        const nameVal = row.getCell(colNama).value;
        if (!nameVal) continue;

        const fullName = String(nameVal).trim();
        if (fullName.toLowerCase().includes('nama peserta didik')) continue;

        let nis = row.getCell(colNis).value ? String(row.getCell(colNis).value).trim() : null;
        if (nis === '') nis = null;
        const jk = row.getCell(colJk).value ? String(row.getCell(colJk).value).trim().toUpperCase() : 'L';
        let nisn = row.getCell(colNisn).value ? String(row.getCell(colNisn).value).trim() : null;
        if (nisn === '') nisn = null;
        const birthPlace = row.getCell(colTmpLahir).value ? String(row.getCell(colTmpLahir).value).trim() : null;
        const religion = row.getCell(colAgama).value ? String(row.getCell(colAgama).value).trim() : null;
        
        let birthDate: Date | null = null;
        const bDateVal = row.getCell(colTglLahir).value;
        if (bDateVal) {
          if (bDateVal instanceof Date) {
            birthDate = bDateVal;
          } else {
            const strDate = String(bDateVal).trim();
            if (strDate.includes('-') && strDate.split('-')[0].length <= 2) {
              const parts = strDate.split('-');
              birthDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            } else if (strDate.includes('/') && strDate.split('/')[0].length <= 2) {
              const parts = strDate.split('/');
              birthDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            } else {
              birthDate = new Date(strDate);
            }
          }
          if (birthDate && isNaN(birthDate.getTime())) birthDate = null;
        }

        const fatherName = row.getCell(colAyah).value ? String(row.getCell(colAyah).value).trim() : null;
        const motherName = row.getCell(colIbu).value ? String(row.getCell(colIbu).value).trim() : null;
        
        let rombelName = row.getCell(colRombel).value ? String(row.getCell(colRombel).value).trim() : 'Belum Dialokasikan';
        if (rombelName.toLowerCase().startsWith('kelas ')) {
          rombelName = rombelName.substring(6).trim();
        }
        if (rombelName.toLowerCase() === 'rombel saat ini' || rombelName === '') {
          rombelName = 'Belum Dialokasikan';
        }

        let classId = classMap.get(rombelName);
        if (!classId) {
          let gradeLevel = 7;
          const matchDigit = rombelName.match(/\d+/);
          if (matchDigit) {
            gradeLevel = parseInt(matchDigit[0], 10);
          }
          classId = crypto.randomUUID();
          classMap.set(rombelName, classId);
          classesToCreate.push({
            id: classId,
            schoolId,
            academicYearId: academicYear.id,
            name: rombelName,
            gradeLevel,
          });
        }

        let studentId = nisn ? studentMapByNisn.get(nisn) : undefined;
        if (!studentId) {
          studentId = studentMapByName.get(fullName.toLowerCase());
        }

        const studentData = {
          nisn,
          nis,
          gender: jk === 'L' || jk === 'P' ? jk : 'L',
          birthPlace,
          birthDate,
          religion,
          fatherName,
          motherName,
        };

        if (!studentId) {
          studentId = crypto.randomUUID();
          if (nisn) studentMapByNisn.set(nisn, studentId);
          studentMapByName.set(fullName.toLowerCase(), studentId);
          
          studentsToCreate.push({
            id: studentId,
            schoolId,
            fullName,
            ...studentData
          });
          imported.push({ id: studentId, fullName, ...studentData });
        } else {
          studentsToUpdate.push({
            id: studentId,
            data: studentData
          });
          imported.push({ id: studentId, fullName, ...studentData });
        }

        classStudentsToCreate.push({
          classId,
          studentId,
        });
      }

      // Execute everything in a single blazing fast transaction
      const operations: any[] = [];
      
      if (classesToCreate.length > 0) {
        operations.push(this.prisma.class.createMany({ data: classesToCreate, skipDuplicates: true }));
      }
      
      if (studentsToCreate.length > 0) {
        operations.push(this.prisma.student.createMany({ data: studentsToCreate, skipDuplicates: true }));
      }
      
      for (const update of studentsToUpdate) {
        operations.push(this.prisma.student.update({
          where: { id: update.id },
          data: update.data
        }));
      }
      
      if (classStudentsToCreate.length > 0) {
        operations.push(this.prisma.classStudent.createMany({ data: classStudentsToCreate, skipDuplicates: true }));
      }

      if (operations.length > 0) {
        await this.prisma.$transaction(operations);
      }

      return { count: imported.length, students: imported };
    } catch (e: any) {
      throw new BadRequestException(`Gagal memproses Excel Dapodik: ${e.message}`);
    }
  }

  async importTeachersExcel(schoolId: string, buffer: any) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const sheet = workbook.worksheets[0];
      
      const imported: any[] = [];
      let headerRowIndex = 5;
      
      for (let i = 1; i <= 10; i++) {
        const rowValues = sheet.getRow(i).values;
        if (Array.isArray(rowValues) && rowValues.includes('NUPTK')) {
          headerRowIndex = i;
          break;
        }
      }

      const totalRows = sheet.rowCount;
      for (let i = headerRowIndex + 1; i <= totalRows; i++) {
        const row = sheet.getRow(i);
        const nameVal = row.getCell(2).value;
        if (!nameVal) continue;

        const fullName = String(nameVal).trim();
        const nuptk = row.getCell(3).value ? String(row.getCell(3).value).trim() : null;
        const jk = row.getCell(4).value ? String(row.getCell(4).value).trim().toUpperCase() : 'L';
        const birthPlace = row.getCell(5).value ? String(row.getCell(5).value).trim() : null;
        
        let birthDate: Date | null = null;
        const bDateVal = row.getCell(6).value;
        if (bDateVal) {
          birthDate = new Date(bDateVal as any);
          if (isNaN(birthDate.getTime())) birthDate = null;
        }

        const nip = row.getCell(7).value ? String(row.getCell(7).value).trim() : null;
        const phone = row.getCell(19).value ? String(row.getCell(19).value).trim() : null;
        
        const emailVal = row.getCell(20).value;
        let email = emailVal ? String(emailVal).trim() : '';
        if (!email || !email.includes('@')) {
          const cleanName = fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
          email = `${cleanName}@binabersama.sch.id`;
        }

        let teacher = await this.prisma.teacher.findUnique({
          where: { email },
        });

        if (!teacher) {
          teacher = await this.prisma.teacher.create({
            data: {
              schoolId,
              fullName,
              email,
              phone,
              passwordHash: await this.hashPassword('guru123'),
              role: 'GURU',
              nuptk,
              nip,
              gender: jk === 'L' || jk === 'P' ? jk : 'L',
            },
          });
          imported.push(teacher);
        }
      }

      return { count: imported.length, teachers: imported };
    } catch (e: any) {
      throw new BadRequestException(`Gagal memproses Excel Guru: ${e.message}`);
    }
  }

  // ──────────────────────────────
  // TEACHER CRUD
  // ──────────────────────────────

  async createTeacher(schoolId: string, data: any) {
    const passwordHash = await this.hashPassword(data.password || 'guru123');
    return this.prisma.teacher.create({
      data: {
        schoolId,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || null,
        passwordHash,
        role: data.role || 'GURU',
        nuptk: data.nuptk || null,
        nip: data.nip || null,
        gender: data.gender || null,
      },
    });
  }

  async updateTeacher(id: string, data: any) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher) throw new NotFoundException('Guru tidak ditemukan');

    const updateData: any = {
      fullName: data.fullName !== undefined ? data.fullName : teacher.fullName,
      email: data.email !== undefined ? data.email : teacher.email,
      phone: data.phone !== undefined ? data.phone : teacher.phone,
      role: data.role !== undefined ? data.role : teacher.role,
      nuptk: data.nuptk !== undefined ? data.nuptk : teacher.nuptk,
      nip: data.nip !== undefined ? data.nip : teacher.nip,
      gender: data.gender !== undefined ? data.gender : teacher.gender,
      isActive: data.isActive !== undefined ? data.isActive : teacher.isActive,
    };

    if (data.password) {
      updateData.passwordHash = await this.hashPassword(data.password);
    }

    return this.prisma.teacher.update({
      where: { id },
      data: updateData,
    });
  }

  async resetTeacherPassword(id: string) {
    const defaultPassword = 'reset123password';
    await this.prisma.teacher.update({
      where: { id },
      data: { passwordHash: await this.hashPassword(defaultPassword) },
    });
    return { defaultPassword };
  }

  // ──────────────────────────────
  // CLASS & SUBJECT MANAGEMENT
  // ──────────────────────────────

  async createClass(schoolId: string, data: any) {
    return this.prisma.class.create({
      data: {
        schoolId,
        academicYearId: data.academicYearId || (await this.prisma.academicYear.findFirst({ where: { schoolId } }))?.id || '',
        name: data.name,
        gradeLevel: data.gradeLevel,
        homeroomTeacherId: data.homeroomTeacherId || null,
      },
    });
  }

  async updateClass(id: string, data: any) {
    return this.prisma.class.update({
      where: { id },
      data: {
        name: data.name,
        gradeLevel: data.gradeLevel,
        homeroomTeacherId: data.homeroomTeacherId || null,
      },
    });
  }

  async assignStudentToClass(classId: string, studentId: string) {
    return this.prisma.classStudent.upsert({
      where: {
        classId_studentId: { classId, studentId },
      },
      update: {},
      create: { classId, studentId },
    });
  }

  async assignSubjectToClass(classId: string, subjectId: string, teacherId: string) {
    const existing = await this.prisma.classSubject.findFirst({
      where: { classId, subjectId },
    });
    if (existing) {
      return this.prisma.classSubject.update({
        where: { id: existing.id },
        data: { teacherId },
      });
    }
    return this.prisma.classSubject.create({
      data: { classId, subjectId, teacherId },
    });
  }

  async removeClassSubject(classId: string, subjectId: string) {
    const existing = await this.prisma.classSubject.findFirst({
      where: { classId, subjectId },
    });
    if (existing) {
      await this.prisma.classSubject.delete({ where: { id: existing.id } });
    }
    return { success: true };
  }

  async getAllClassSubjects(schoolId: string) {
    return this.prisma.classSubject.findMany({
      where: { class: { schoolId } },
      include: {
        subject: true,
        teacher: true,
      },
    });
  }

  async createSubject(schoolId: string, data: any) {
    return this.prisma.subject.create({
      data: {
        schoolId,
        name: data.name,
        code: data.code || null,
        description: data.description || null,
      },
    });
  }

  async updateSubject(id: string, data: any) {
    return this.prisma.subject.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        description: data.description || null,
      },
    });
  }

  async deleteSubject(id: string) {
    return this.prisma.subject.delete({
      where: { id },
    });
  }

  // ──────────────────────────────
  // REPORTS EXPORT METRICS
  // ──────────────────────────────

  async getGradesReport(classSubjectId: string) {
    const classSubject = await this.prisma.classSubject.findUnique({
      where: { id: classSubjectId },
      include: {
        class: {
          include: {
            classStudents: { include: { student: true } },
          },
        },
        subject: true,
      },
    });

    if (!classSubject) throw new NotFoundException('Kelas mata pelajaran tidak ditemukan');

    const [gradeEntries, allGrades] = await Promise.all([
      this.prisma.gradeEntry.findMany({
        where: { classSubjectId },
        orderBy: { date: 'asc' },
      }),
      this.prisma.grade.findMany({
        where: { gradeEntry: { classSubjectId } },
      }),
    ]);

    const gradesByStudent = new Map<string, typeof allGrades>();
    for (const g of allGrades) {
      const existing = gradesByStudent.get(g.studentId) || [];
      existing.push(g);
      gradesByStudent.set(g.studentId, existing);
    }

    const studentGrades = classSubject.class.classStudents.map((cs) => {
      const studentGrades = gradesByStudent.get(cs.student.id) || [];
      const scoresMap: Record<string, number | null> = {};
      for (const ge of gradeEntries) {
        const g = studentGrades.find((sg) => sg.gradeEntryId === ge.id);
        scoresMap[ge.id] = g ? g.score : null;
      }

      return {
        studentId: cs.student.id,
        studentName: cs.student.fullName,
        nisn: cs.student.nisn,
        nis: cs.student.nis,
        scores: scoresMap,
      };
    });

    return {
      className: classSubject.class.name,
      subjectName: classSubject.subject.name,
      gradeEntries: gradeEntries.map((ge) => ({ id: ge.id, title: ge.title, date: ge.date?.toISOString() })),
      reportData: studentGrades,
    };
  }

  async getAttendanceReport(classId: string, startDateStr: string, endDateStr: string) {
    const classRecord = await this.prisma.class.findUnique({
      where: { id: classId },
      include: { classStudents: { include: { student: true } } },
    });

    if (!classRecord) throw new NotFoundException('Kelas tidak ditemukan');

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    const attendances = await this.prisma.attendance.findMany({
      where: {
        classId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });

    // Extract unique dates
    const uniqueDates = Array.from(new Set(attendances.map((a) => a.date.toISOString().split('T')[0]))).sort();

    const studentAttendance = classRecord.classStudents.map((cs) => {
      const records = attendances.filter((a) => a.studentId === cs.studentId);
      const attendanceMap: Record<string, string> = {};

      for (const d of uniqueDates) {
        const match = records.find((r) => r.date.toISOString().split('T')[0] === d);
        attendanceMap[d] = match ? match.status : '-';
      }

      return {
        studentId: cs.student.id,
        studentName: cs.student.fullName,
        nisn: cs.student.nisn,
        attendance: attendanceMap,
        summary: {
          hadir: records.filter((r) => r.status === 'HADIR').length,
          izin: records.filter((r) => r.status === 'IZIN').length,
          sakit: records.filter((r) => r.status === 'SAKIT').length,
          alpa: records.filter((r) => r.status === 'ALPA').length,
        },
      };
    });

    return {
      className: classRecord.name,
      dates: uniqueDates,
      reportData: studentAttendance,
    };
  }
}
