import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CreateChatDto } from './dto/create-chat.dto';
import { ChatService } from './chat.service';
import { extname } from 'path';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_')}`;
          cb(null, safeName);
        },
      }),
    }),
  )
  async create(@Body() createChatDto: CreateChatDto, @UploadedFile() file?: any) {
    const imageUrl = file ? `/uploads/${file.filename}` : undefined;
    const result = await this.chatService.handleMessage(createChatDto.message, imageUrl);
    return result;
  }
}
