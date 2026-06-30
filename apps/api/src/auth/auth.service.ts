import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

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

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1. Handle Super Admin auto-seed in SQLite if needed
    if (email === 'superadmin@sekolahpintar.id' && password === 'superadmin123') {
      let school = await this.prisma.school.findFirst({ where: { name: 'SekolahPintar System' } });
      if (!school) {
        school = await this.prisma.school.create({
          data: { name: 'SekolahPintar System', npsn: '00000000', status: 'SWASTA', level: 'SMP', city: 'Bandung' }
        });
      }
      let superTeacher = await this.prisma.teacher.findUnique({ where: { email } });
      if (!superTeacher) {
        await this.prisma.teacher.create({
          data: {
            schoolId: school.id,
            fullName: 'Super Admin SekolahPintar',
            email,
            passwordHash: await this.hashPassword(password),
            role: 'SUPER_ADMIN',
            isActive: true,
          }
        });
      } else if (superTeacher.role !== 'SUPER_ADMIN') {
        // Fix existing superadmin role
        await this.prisma.teacher.update({
          where: { email },
          data: { role: 'SUPER_ADMIN' },
        });
      }
    }

    let teacher = await this.prisma.teacher.findUnique({
      where: { email },
      include: { school: true },
    });

    // Hanya akun yang sudah terdaftar yang bisa login
    if (!teacher || !teacher.isActive) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const isMatch = await this.comparePassword(password, teacher.passwordHash);

    if (!isMatch) {
      throw new UnauthorizedException('Email atau password salah');
    }

    if (!teacher.passwordHash.startsWith('$2')) {
      await this.prisma.teacher.update({
        where: { id: teacher.id },
        data: { passwordHash: await this.hashPassword(password) },
      });
    }


    const payload = {
      email: teacher.email,
      sub: teacher.id,
      role: teacher.role,
      schoolId: teacher.schoolId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRATION || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    });

    return {
      accessToken,
      refreshToken,
      teacher: {
        id: teacher.id,
        fullName: teacher.fullName,
        email: teacher.email,
        role: teacher.role,
        photoUrl: teacher.photoUrl,
        schoolId: teacher.schoolId,
        schoolName: teacher.school.name,
        preferences: teacher.preferences,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const teacher = await this.prisma.teacher.findUnique({
        where: { id: payload.sub },
        include: { school: true },
      });

      if (!teacher || !teacher.isActive) {
        throw new UnauthorizedException('Pengguna tidak aktif');
      }

      const newPayload = {
        email: teacher.email,
        sub: teacher.id,
        role: teacher.role,
        schoolId: teacher.schoolId,
      };

      const newAccessToken = this.jwtService.sign(newPayload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRATION || '15m',
      });

      return {
        accessToken: newAccessToken,
      };
    } catch (e) {
      throw new UnauthorizedException('Sesi tidak valid, silakan login kembali');
    }
  }
}
