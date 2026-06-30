import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('overview')
  async getOverview(@Req() req: { user: { id: string } }) {
    const data = await this.analyticsService.getTeacherAnalytics(req.user.id);
    return {
      success: true,
      data,
    };
  }
}
