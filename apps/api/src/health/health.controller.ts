import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check() {
    const dbStart = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const dbLatency = Date.now() - dbStart;
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: { connected: true, latencyMs: dbLatency },
        memory: process.memoryUsage(),
      };
    } catch {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: { connected: false },
      };
    }
  }
}
