import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { ConfirmIntakeDto } from './dto/confirm-intake.dto';
import { IntakeResponseDto } from './dto/intake-response.dto';
import { MedicationIntakesService } from './medication-intakes.service';

@ApiBearerAuth()
@ApiTags('medication-intakes')
@UseGuards(JwtAuthGuard)
@Controller('medication-intakes')
export class MedicationIntakesController {
  constructor(
    private readonly medicationIntakesService: MedicationIntakesService,
  ) {}

  @Patch(':id/confirm')
  confirm(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConfirmIntakeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<IntakeResponseDto> {
    return this.medicationIntakesService.confirm(id, dto, user.userId);
  }
}