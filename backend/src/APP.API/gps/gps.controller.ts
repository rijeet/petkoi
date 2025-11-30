import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GPSService } from '../../APP.BLL/services/gps.service';
import { CreateGPSLocationDto, GetGPSHistoryDto } from '../../APP.Shared/dtos/gps.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('pets/:petId/gps')
@UseGuards(JwtAuthGuard)
export class GPSController {
  constructor(private gpsService: GPSService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async recordLocation(
    @Param('petId') petId: string,
    @Body() createGPSDto: CreateGPSLocationDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.gpsService.recordLocation(petId, createGPSDto.lat, createGPSDto.lng, createGPSDto.note);
  }

  @Get('history')
  async getHistory(
    @Param('petId') petId: string,
    @Query() query: GetGPSHistoryDto,
  ) {
    return this.gpsService.getHistory(petId, query.limit, query.offset);
  }

  @Get('last')
  async getLastLocation(@Param('petId') petId: string) {
    return this.gpsService.getLastLocation(petId);
  }

  @Get('nearby')
  @Public()
  async findNearbyPets(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radiusKm') radiusKm?: string,
  ) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radius = radiusKm ? parseFloat(radiusKm) : 2;

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error('Invalid latitude or longitude');
    }

    return this.gpsService.findNearbyPets(latitude, longitude, radius);
  }
}

