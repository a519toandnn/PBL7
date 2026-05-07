import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatService {
  // Simple rule-based bot reply
  async handleMessage(message: string, imagePath?: string) {
    const text = (message || '').toLowerCase();
    let reply = 'Cảm ơn bạn, chúng tôi đã nhận được tin nhắn của bạn.';

    if (/hello|xin chào|chào/i.test(text)) {
      reply = 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay?';
    } else if (/sốt|sot|sốt|fever|đau|đau đầu|đau bụng/i.test(text)) {
      reply = 'Nếu bạn bị sốt hoặc đau nặng, hãy nghỉ ngơi và liên hệ bác sĩ nếu triệu chứng kéo dài.';
    } else if (/thuốc|uống|dùng/i.test(text)) {
      reply = 'Bạn có thể cho biết thêm triệu chứng để mình tư vấn loại thuốc phù hợp hơn không?';
    }

    const data: any = {
      message,
      reply,
    };
    if (imagePath) {
      data.imageUrl = imagePath;
    }

    return data;
  }
}
