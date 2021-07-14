import { ClassSerializerInterceptor, HttpModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { ConfigurationModule } from './configuration/configuration.module';
import { UtilController } from './core/util.controller';
import { LoggerModule } from './logger/logger.module';
import { PaymentModule } from './payment/payment.module';
import { MagazineModule } from './post/magazine.module';
import { ProductModule } from './product/product.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST,
      port: +process.env.DATABASE_PORT,
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_DB,
      autoLoadEntities: true,
      synchronize: false,
      charset: "utf8mb4"
    }),
    UserModule,
    AuthModule,
    ProductModule,
    PaymentModule,
    MagazineModule,
    ConfigurationModule,
    LoggerModule,
    HttpModule
  ],
  controllers: [
    AppController,
    UtilController
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule { }
