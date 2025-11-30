import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PetService } from '../../APP.BLL/services/pet.service';
import { CreatePetDto, UpdatePetDto } from '../../APP.Shared/dtos/pet.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('pets')
@ApiBearerAuth('JWT-auth')
@Controller('pets')
@UseGuards(JwtAuthGuard)
export class PetsController {
  constructor(private petService: PetService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new pet' })
  @ApiResponse({ status: 201, description: 'Pet created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPetDto: CreatePetDto, @CurrentUser() user: { sub: string }) {
    // Cast enum types - DTO validates them, but TypeScript needs explicit cast for Prisma
    return this.petService.create({
      ...createPetDto,
      dateOfBirth: createPetDto.dateOfBirth ? new Date(createPetDto.dateOfBirth) : undefined,
      type: createPetDto.type as any,
      gender: createPetDto.gender as any,
      ownerId: user.sub,
    });
  }

  @Get()
  async findAll(@CurrentUser() user: { sub: string }) {
    return this.petService.findByOwnerId(user.sub);
  }

  @Get('public/:id')
  @Public()
  @ApiOperation({ summary: 'Get public pet profile (QR code landing page)' })
  @ApiResponse({ status: 200, description: 'Pet profile retrieved' })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  async getPublicProfile(@Param('id') id: string) {
    return this.petService.getPublicProfile(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.petService.findById(id);
  }

  @Get(':id/qr')
  async getQRCode(@Param('id') id: string) {
    const qrDataUrl = await this.petService.generateQRCode(id);
    return { qrCode: qrDataUrl };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePetDto: UpdatePetDto,
    @CurrentUser() user: { sub: string },
  ) {
    // Cast enum types properly for Prisma
    const data: any = {
      ...updatePetDto,
      dateOfBirth: updatePetDto.dateOfBirth ? new Date(updatePetDto.dateOfBirth) : undefined,
      // Cast enum types - DTO validates them, but TypeScript needs explicit cast for Prisma
      ...(updatePetDto.type && { type: updatePetDto.type as any }),
      ...(updatePetDto.gender && { gender: updatePetDto.gender as any }),
    };
    return this.petService.update(id, user.sub, data);
  }

  @Patch(':id/lost')
  @HttpCode(HttpStatus.OK)
  async setLostStatus(
    @Param('id') id: string,
    @Body() body: { isLost: boolean },
    @CurrentUser() user: { sub: string },
  ) {
    return this.petService.setLostStatus(id, user.sub, body.isLost);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    await this.petService.delete(id, user.sub);
  }

  @Post(':id/found')
  @Public()
  @HttpCode(HttpStatus.OK)
  async reportFound(
    @Param('id') id: string,
    @Body() body: { lat: number; lng: number; address?: string; note?: string; imageUrl?: string },
  ) {
    // This endpoint is public - anyone can report finding a lost pet
    // The notification service will handle notifying the owner
    return this.petService.reportFound(id, body.lat, body.lng, body.address, body.note, body.imageUrl);
  }
}

