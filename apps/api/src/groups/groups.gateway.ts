import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GroupsService } from './groups.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GroupsGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private groupsService: GroupsService) {}

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody('groupId') groupId: string, @ConnectedSocket() client: Socket) {
    client.join(groupId);
    console.log(`🔌 Client ${client.id} joined room ${groupId}`);
    return { event: 'joined', data: groupId };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@MessageBody('groupId') groupId: string, @ConnectedSocket() client: Socket) {
    client.leave(groupId);
    console.log(`🔌 Client ${client.id} left room ${groupId}`);
    return { event: 'left', data: groupId };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      groupId: string;
      senderId: string;
      content: string;
      messageType?: string;
      fileUrl?: string;
    },
  ) {
    const savedMsg = await this.groupsService.sendMessage({
      groupId: data.groupId,
      senderId: data.senderId,
      content: data.content,
      messageType: data.messageType,
      fileUrl: data.fileUrl,
    });

    // Broadcast message to everyone in the room (including sender)
    this.server.to(data.groupId).emit('messageReceived', savedMsg);
    return savedMsg;
  }
}
