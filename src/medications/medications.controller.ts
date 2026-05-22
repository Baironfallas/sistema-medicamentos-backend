import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, UseGuards, } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { MedicationResponseDto } from './dto/medication-response.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { MedicationsService } from './medications.service';
import { IntakeResponseDto } from 'src/medication-intakes/dto/intake-response.dto';

@ApiBearerAuth()
@ApiTags('medications')
@UseGuards(JwtAuthGuard)
@Controller('medications')
export class MedicationsController {

    constructor(private readonly medicationsService: MedicationsService) { }

    @Post()
    create(
        @Body() dto: CreateMedicationDto,
        @CurrentUser() user: AuthenticatedUser,
    ): Promise<MedicationResponseDto> {
        return this.medicationsService.create(dto, user.userId);
    }

    @Get()
    findAll(
        @CurrentUser() user: AuthenticatedUser,
    ): Promise<MedicationResponseDto[]> {
        return this.medicationsService.findAllByUser(user.userId);
    }

    @Get('today-intakes')
    getTodayIntakes(
        @CurrentUser() user: AuthenticatedUser,
    ): Promise<IntakeResponseDto[]> {
        return this.medicationsService.getTodayIntakes(user.userId);
    }

    @Get(':id')
    findOne(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: AuthenticatedUser,
    ): Promise<MedicationResponseDto> {
        return this.medicationsService.findOneByUser(id, user.userId);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateMedicationDto,
        @CurrentUser() user: AuthenticatedUser,
    ): Promise<MedicationResponseDto> {
        return this.medicationsService.update(id, dto, user.userId);
    }

    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete(':id')
    remove(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: AuthenticatedUser,
    ): Promise<void> {
        return this.medicationsService.remove(id, user.userId);
    }
}