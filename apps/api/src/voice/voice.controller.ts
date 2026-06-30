import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { VoiceService } from './voice.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('voice')
export class VoiceController {
  constructor(private voiceService: VoiceService) {}

  @Post('parse')
  async parseCommand(
    @Body('text') text: string,
    @Body('classId') classId: string,
    @Body('subjectId') subjectId?: string,
  ) {
    const data = await this.voiceService.parseCommand(text, classId, subjectId);
    return {
      success: true,
      data,
    };
  }
}
