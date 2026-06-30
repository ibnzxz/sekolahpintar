import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: { sub: string; email: string; role: string; schoolId: string }) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: payload.sub },
      include: { school: true },
    });
    if (!teacher || !teacher.isActive) {
      throw new UnauthorizedException('Pengguna tidak ditemukan atau tidak aktif');
    }
    return {
      id: teacher.id,
      email: teacher.email,
      fullName: teacher.fullName,
      role: teacher.role,
      schoolId: teacher.schoolId,
      schoolName: teacher.school.name,
      photoUrl: teacher.photoUrl,
      preferences: teacher.preferences,
    };
  }
}
