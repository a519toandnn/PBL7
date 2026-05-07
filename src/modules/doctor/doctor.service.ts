import { Injectable } from '@nestjs/common';

@Injectable()
export class DoctorService {
  // In-memory storage for doctor messages (in production, use database)
  private messages: any[] = [];

  async sendMessage(userId: string, message: string, imagePath?: string) {
    const msg = {
      id: Date.now(),
      userId,
      message,
      imagePath,
      createdAt: new Date(),
      isRead: false,
      doctorReply: null,
    };
    this.messages.push(msg);
    return msg;
  }

  async getPatientMessages(userId: string) {
    return this.messages.filter(m => m.userId === userId);
  }

  async getAllMessages() {
    return this.messages;
  }

  async replyToMessage(messageId: number, doctorReply: string) {
    const msg = this.messages.find(m => m.id === messageId);
    if (msg) {
      msg.doctorReply = doctorReply;
      msg.isRead = true;
    }
    return msg;
  }
}
