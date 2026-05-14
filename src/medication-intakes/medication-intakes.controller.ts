import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MedicationIntakesService } from './medication-intakes.service';
import { CreateMedicationIntakeDto } from './dto/create-medication-intake.dto';
import { UpdateMedicationIntakeDto } from './dto/update-medication-intake.dto';

@Controller('medication-intakes')
export class MedicationIntakesController {
  constructor(private readonly medicationIntakesService: MedicationIntakesService) {}

  @Post()
  create(@Body() createMedicationIntakeDto: CreateMedicationIntakeDto) {
    return this.medicationIntakesService.create(createMedicationIntakeDto);
  }

  @Get()
  findAll() {
    return this.medicationIntakesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.medicationIntakesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMedicationIntakeDto: UpdateMedicationIntakeDto) {
    return this.medicationIntakesService.update(+id, updateMedicationIntakeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.medicationIntakesService.remove(+id);
  }
}
