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
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

const getPositiveIntegerConfig = (
  configService: ConfigService,
  key: string,
  defaultValue: number,
): number => {
  const rawValue = configService.get<string>(key);

  if (rawValue === undefined || rawValue.trim() === '') {
    return defaultValue;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`La variable de entorno ${key} debe ser un número entero positivo.`);
  }

  return parsedValue;
};

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
        redact: [
          'req.headers.authorization',
          'req.body.password',
          'req.body.refreshToken',
        ],
      },
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.getOrThrow<string>('DATABASE_HOST'),
        port: getPositiveIntegerConfig(configService, 'DATABASE_PORT', 3306),
        username: configService.get<string>('DATABASE_USER', 'root'),
        password: configService.get<string>('DATABASE_PASSWORD', ''),
        database: configService.getOrThrow<string>('DATABASE_NAME'),
        synchronize: false,
        dropSchema: false,
        autoLoadEntities: true,
        timezone: configService.get<string>('DATABASE_TIMEZONE', '-06:00'),
        dateStrings: true,
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: getPositiveIntegerConfig(configService, 'THROTTLE_TTL', 60000),
          limit: getPositiveIntegerConfig(configService, 'THROTTLE_LIMIT', 100),
        },
        {
          name: 'register',
          ttl: getPositiveIntegerConfig(configService, 'REGISTER_THROTTLE_TTL', 60000),
          limit: getPositiveIntegerConfig(configService, 'REGISTER_THROTTLE_LIMIT', 3),
        },
        {
          name: 'login',
          ttl: getPositiveIntegerConfig(configService, 'LOGIN_THROTTLE_TTL', 60000),
          limit: getPositiveIntegerConfig(configService, 'LOGIN_THROTTLE_LIMIT', 5),
        },
        {
          name: 'chat',
          ttl: getPositiveIntegerConfig(configService, 'CHAT_THROTTLE_TTL', 60000),
          limit: getPositiveIntegerConfig(configService, 'CHAT_THROTTLE_LIMIT', 10),
        },
      ],
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
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }