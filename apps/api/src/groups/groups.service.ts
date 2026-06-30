import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async createGroup(data: { schoolId: string; name: string; description?: string; groupType: 'MATA_PELAJARAN' | 'JENJANG' | 'UMUM'; creatorId: string }) {
    return this.prisma.$transaction(async (tx) => {
      const group = await tx.teacherGroup.create({
        data: {
          schoolId: data.schoolId,
          name: data.name,
          description: data.description || null,
          groupType: data.groupType as any,
          createdById: data.creatorId,
        },
      });

      // Creator automatically becomes Admin member
      await tx.teacherGroupMember.create({
        data: {
          groupId: group.id,
          teacherId: data.creatorId,
          role: 'ADMIN',
        },
      });

      return group;
    });
  }

  async getTeacherGroups(teacherId: string) {
    const memberships = await this.prisma.teacherGroupMember.findMany({
      where: { teacherId },
      include: {
        group: {
          include: {
            members: { select: { id: true } },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { sender: { select: { fullName: true } } },
            },
          },
        },
      },
    });

    return memberships.map((m) => {
      const lastMsg = m.group.messages[0];
      return {
        id: m.group.id,
        name: m.group.name,
        description: m.group.description,
        groupType: m.group.groupType,
        memberCount: m.group.members.length,
        lastMessage: lastMsg
          ? {
              id: lastMsg.id,
              senderName: lastMsg.sender.fullName,
              senderId: lastMsg.senderId,
              content: lastMsg.content,
              messageType: lastMsg.messageType,
              fileUrl: lastMsg.fileUrl,
              isPinned: lastMsg.isPinned,
              createdAt: lastMsg.createdAt.toISOString(),
            }
          : undefined,
      };
    });
  }

  async getMessages(groupId: string, limit = 50) {
    const messages = await this.prisma.groupMessage.findMany({
      where: { groupId },
      include: { sender: { select: { fullName: true } } },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return messages.map((msg) => ({
      id: msg.id,
      senderName: msg.sender.fullName,
      senderId: msg.senderId,
      content: msg.content,
      messageType: msg.messageType,
      fileUrl: msg.fileUrl,
      isPinned: msg.isPinned,
      createdAt: msg.createdAt.toISOString(),
    }));
  }

  async sendMessage(data: { groupId: string; senderId: string; content: string; messageType?: string; fileUrl?: string }) {
    const group = await this.prisma.teacherGroup.findUnique({ where: { id: data.groupId } });
    if (!group) throw new NotFoundException('Grup tidak ditemukan');

    const msg = await this.prisma.groupMessage.create({
      data: {
        groupId: data.groupId,
        senderId: data.senderId,
        content: data.content,
        messageType: (data.messageType || 'TEXT') as any,
        fileUrl: data.fileUrl || null,
      },
      include: {
        sender: { select: { fullName: true } },
      },
    });

    return {
      id: msg.id,
      senderName: msg.sender.fullName,
      senderId: msg.senderId,
      content: msg.content,
      messageType: msg.messageType,
      fileUrl: msg.fileUrl,
      isPinned: msg.isPinned,
      createdAt: msg.createdAt.toISOString(),
    };
  }

  async togglePinMessage(messageId: string) {
    const msg = await this.prisma.groupMessage.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException('Pesan tidak ditemukan');

    return this.prisma.groupMessage.update({
      where: { id: messageId },
      data: { isPinned: !msg.isPinned },
    });
  }

  async addMember(groupId: string, teacherId: string) {
    return this.prisma.teacherGroupMember.create({
      data: { groupId, teacherId, role: 'MEMBER' },
    });
  }
}
