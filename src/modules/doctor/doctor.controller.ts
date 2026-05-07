import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CreateDoctorMessageDto } from './dto/create-doctor-message.dto';
import { DoctorService } from './doctor.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../user/entities/user.entity';

@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post('message')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
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
  async sendMessage(
    @Body() dto: CreateDoctorMessageDto,
    @UploadedFile() file: any,
    @Request() req: any,
  ) {
    const isAdmin = req.user?.role === UserRole.ADMIN;
    if (!isAdmin && String(req.user?.userId) !== String(dto.userId)) {
      throw new ForbiddenException('You can only send messages as yourself');
    }
    const imageUrl = file ? `/uploads/${file.filename}` : undefined;
    const result = await this.doctorService.sendMessage(dto.userId, dto.message, imageUrl);
    return result;
  }

  @Get('messages/patient/:userId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  async getPatientMessages(@Param('userId') userId: string, @Request() req: any) {
    const requestedId = String(userId);
    const isAdmin = req.user?.role === UserRole.ADMIN;
    if (!isAdmin && String(req.user?.userId) !== requestedId) {
      throw new ForbiddenException('You can only view your own messages');
    }
    return await this.doctorService.getPatientMessages(userId);
  }

  @Get('messages/all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllMessages() {
    return await this.doctorService.getAllMessages();
  }

  @Post('message/:messageId/reply')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async replyToMessage(
    @Param('messageId') messageId: string,
    @Body('doctorReply') doctorReply: string,
  ) {
    return await this.doctorService.replyToMessage(Number(messageId), doctorReply);
  }
}
