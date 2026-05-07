import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { CategoryModule } from './modules/category/category.module';
import { MedicineModule } from './modules/medicine/medicine.module';
import { CartModule } from './modules/cart/cart.module';
import { CartitemModule } from './modules/cartitem/cartitem.module';
import { OrderModule } from './modules/order/order.module';
import { OrderitemModule } from './modules/orderitem/orderitem.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ChatModule } from './modules/chat/chat.module';
import { DoctorModule } from './modules/doctor/doctor.module';
import { typeORMConfig } from './configs/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => typeORMConfig(configService),
    }),
    AuthModule,
    UserModule,
    CategoryModule,
    MedicineModule,
    CartModule,
    CartitemModule,
    OrderModule,
    OrderitemModule,
    PaymentModule,
    ChatModule,
    DoctorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
