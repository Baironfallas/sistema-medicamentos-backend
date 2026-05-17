import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MedicationsModule } from './medications/medications.module';
import { SchedulesModule } from './schedules/schedules.module';
import { MedicationIntakesModule } from './medication-intakes/medication-intakes.module';
import { ChatSessionsModule } from './chat-sessions/chat-sessions.module';
import { ChatMessagesModule } from './chat-messages/chat-messages.module';
import { AuthModule } from './auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ScheduleModule.forRoot(),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
            : undefined,
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        redact: ['req.headers.authorization'],
      },
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.getOrThrow<string>('DATABASE_HOST'),
        port: parseInt(configService.get<string>('DATABASE_PORT', '3306'), 10),
        username: configService.get<string>('DATABASE_USER', 'root'),
        password: configService.get<string>('DATABASE_PASSWORD', ''),
        database: configService.getOrThrow<string>('DATABASE_NAME'),
        synchronize: false,
        dropSchema: false,
        autoLoadEntities: true,
        timezone: '-06:00',
        dateStrings: true,
      }),
    }),

    UsersModule,
    MedicationsModule,
    SchedulesModule,
    MedicationIntakesModule,
    ChatSessionsModule,
    ChatMessagesModule,
    AuthModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }