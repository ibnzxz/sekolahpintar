import { Controller, Post, Body, Get, Param, Put, UseGuards, Req } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @Post()
  async createGroup(
    @Body() body: { name: string; description?: string; groupType: 'MATA_PELAJARAN' | 'JENJANG' | 'UMUM' },
    @Req() req: { user: { id: string; schoolId: string } },
  ) {
    const data = await this.groupsService.createGroup({
      ...body,
      schoolId: req.user.schoolId,
      creatorId: req.user.id,
    });
    return {
      success: true,
      data,
    };
  }

  @Get()
  async getTeacherGroups(@Req() req: { user: { id: string } }) {
    const data = await this.groupsService.getTeacherGroups(req.user.id);
    return {
      success: true,
      data,
    };
  }

  @Get(':id/messages')
  async getMessages(@Param('id') id: string) {
    const data = await this.groupsService.getMessages(id);
    return {
      success: true,
      data,
    };
  }

  @Post(':id/messages')
  async sendMessage(
    @Param('id') groupId: string,
    @Body() body: { content: string; messageType?: string; fileUrl?: string },
    @Req() req: { user: { id: string } },
  ) {
    const data = await this.groupsService.sendMessage({
      groupId,
      senderId: req.user.id,
      content: body.content,
      messageType: body.messageType,
      fileUrl: body.fileUrl,
    });
    return {
      success: true,
      data,
    };
  }

  @Put('messages/:mid/pin')
  async togglePin(@Param('mid') messageId: string) {
    const data = await this.groupsService.togglePinMessage(messageId);
    return {
      success: true,
      data,
    };
  }
}
