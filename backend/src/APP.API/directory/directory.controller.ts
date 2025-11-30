import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DirectoryService } from '../../APP.BLL/services/directory.service';
import {
  CreateGuardDto,
  UpdateGuardDto,
  CreateWasteCollectorDto,
  UpdateWasteCollectorDto,
  FindNearbyGuardsDto,
} from '../../APP.Shared/dtos/directory.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('directory')
export class DirectoryController {
  constructor(private directoryService: DirectoryService) {}

  // Guard endpoints

  @Post('guards')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  async createGuard(@Body() createGuardDto: CreateGuardDto) {
    return this.directoryService.createGuard(createGuardDto);
  }

  @Get('guards')
  @Public()
  async getGuards(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    return this.directoryService.getGuards(limitNum, offsetNum);
  }

  @Get('guards/:id')
  @Public()
  async getGuard(@Param('id') id: string) {
    return this.directoryService.getGuardById(id);
  }

  @Get('guards/nearby')
  @Public()
  async findNearbyGuards(@Query() query: FindNearbyGuardsDto) {
    const lat = parseFloat(query.lat);
    const lng = parseFloat(query.lng);
    const radiusKm = query.radiusKm ? parseFloat(query.radiusKm) : 5;

    if (isNaN(lat) || isNaN(lng)) {
      throw new Error('Invalid latitude or longitude');
    }

    return this.directoryService.findNearbyGuards(lat, lng, radiusKm);
  }

  @Put('guards/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateGuard(@Param('id') id: string, @Body() updateGuardDto: UpdateGuardDto) {
    return this.directoryService.updateGuard(id, updateGuardDto);
  }

  @Delete('guards/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGuard(@Param('id') id: string) {
    await this.directoryService.deleteGuard(id);
  }

  // Waste Collector endpoints

  @Post('waste-collectors')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  async createWasteCollector(@Body() createCollectorDto: CreateWasteCollectorDto) {
    return this.directoryService.createWasteCollector(createCollectorDto);
  }

  @Get('waste-collectors')
  @Public()
  async getWasteCollectors(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    return this.directoryService.getWasteCollectors(limitNum, offsetNum);
  }

  @Get('waste-collectors/ward/:ward')
  @Public()
  async getWasteCollectorsByWard(@Param('ward') ward: string) {
    return this.directoryService.getWasteCollectorsByWard(ward);
  }

  @Get('waste-collectors/:id')
  @Public()
  async getWasteCollector(@Param('id') id: string) {
    return this.directoryService.getWasteCollectorById(id);
  }

  @Put('waste-collectors/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateWasteCollector(
    @Param('id') id: string,
    @Body() updateCollectorDto: UpdateWasteCollectorDto,
  ) {
    return this.directoryService.updateWasteCollector(id, updateCollectorDto);
  }

  @Delete('waste-collectors/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteWasteCollector(@Param('id') id: string) {
    await this.directoryService.deleteWasteCollector(id);
  }
}

