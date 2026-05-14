import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MedicationsModule } from './medications/medications.module';
import { SchedulesModule } from './schedules/schedules.module';
import { MedicationIntakesModule } from './medication-intakes/medication-intakes.module';
import { ChatSessionsModule } from './chat-sessions/chat-sessions.module';
import { ChatMessagesModule } from './chat-messages/chat-messages.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.getOrThrow<string>('DATABASE_HOST'),
        port: parseInt(
          configService.get<string>('DATABASE_PORT', '3306'),
          10,
        ),
        username: configService.get<string>('DATABASE_USER', 'root'),
        password: configService.get<string>('DATABASE_PASSWORD', ''),
        database: configService.getOrThrow<string>('DATABASE_NAME'),
        synchronize: false,
        dropSchema: false,
        autoLoadEntities: true,
        timezone: 'Z',
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
export class AppModule {}