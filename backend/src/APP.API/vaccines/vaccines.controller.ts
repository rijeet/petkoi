import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { VaccineService } from '../../APP.BLL/services/vaccine.service';
import { CreateVaccineDto, UpdateVaccineDto } from '../../APP.Shared/dtos/vaccine.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('vaccines')
@ApiBearerAuth('JWT-auth')
@Controller('pets/:petId/vaccines')
@UseGuards(JwtAuthGuard)
export class VaccinesController {
  constructor(private readonly vaccineService: VaccineService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new vaccine record for a pet' })
  @ApiBody({ type: CreateVaccineDto })
  @ApiResponse({ status: 201, description: 'Vaccine record created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 403, description: 'You do not own this pet' })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  @HttpCode(HttpStatus.CREATED)
  async createVaccine(
    @Param('petId') petId: string,
    @Body() createVaccineDto: CreateVaccineDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.vaccineService.createVaccine(petId, createVaccineDto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all vaccines for a pet' })
  @ApiResponse({ status: 200, description: 'Vaccines retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  async getPetVaccines(
    @Param('petId') petId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.vaccineService.getPetVaccines(petId, user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific vaccine record by ID' })
  @ApiResponse({ status: 200, description: 'Vaccine retrieved successfully' })
  @ApiResponse({ status: 403, description: 'You do not have permission to view this vaccine' })
  @ApiResponse({ status: 404, description: 'Vaccine not found' })
  async getVaccineById(
    @Param('petId') petId: string,
    @Param('id') vaccineId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.vaccineService.getVaccineById(vaccineId, user.sub);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a vaccine record' })
  @ApiBody({ type: UpdateVaccineDto })
  @ApiResponse({ status: 200, description: 'Vaccine updated successfully' })
  @ApiResponse({ status: 403, description: 'You do not have permission to update this vaccine' })
  @ApiResponse({ status: 404, description: 'Vaccine not found' })
  @HttpCode(HttpStatus.OK)
  async updateVaccine(
    @Param('petId') petId: string,
    @Param('id') vaccineId: string,
    @Body() updateVaccineDto: UpdateVaccineDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.vaccineService.updateVaccine(vaccineId, updateVaccineDto, user.sub);
  }

  @Post(':id/prescription')
  @ApiOperation({ summary: 'Upload prescription image for a vaccine record' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Prescription image file',
        },
      },
      required: ['image'],
    },
  })
  @ApiResponse({ status: 200, description: 'Prescription image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'No image file provided or invalid file' })
  @ApiResponse({ status: 403, description: 'You do not have permission to upload prescription for this vaccine' })
  @ApiResponse({ status: 404, description: 'Vaccine not found' })
  @UseInterceptors(FileInterceptor('image'))
  @HttpCode(HttpStatus.OK)
  async uploadPrescription(
    @Param('petId') petId: string,
    @Param('id') vaccineId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { sub: string },
  ) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    return this.vaccineService.uploadPrescriptionImage(vaccineId, file, user.sub);
  }

  @Delete(':id/prescription')
  @ApiOperation({ summary: 'Delete prescription image from a vaccine record' })
  @ApiResponse({ status: 200, description: 'Prescription image deleted successfully' })
  @ApiResponse({ status: 400, description: 'No prescription image to delete' })
  @ApiResponse({ status: 403, description: 'You do not have permission to delete this prescription' })
  @ApiResponse({ status: 404, description: 'Vaccine not found' })
  @HttpCode(HttpStatus.OK)
  async deletePrescription(
    @Param('petId') petId: string,
    @Param('id') vaccineId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.vaccineService.deletePrescriptionImage(vaccineId, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a vaccine record' })
  @ApiResponse({ status: 204, description: 'Vaccine deleted successfully' })
  @ApiResponse({ status: 403, description: 'You do not have permission to delete this vaccine' })
  @ApiResponse({ status: 404, description: 'Vaccine not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteVaccine(
    @Param('petId') petId: string,
    @Param('id') vaccineId: string,
    @CurrentUser() user: { sub: string },
  ) {
    await this.vaccineService.deleteVaccine(vaccineId, user.sub);
  }
}

