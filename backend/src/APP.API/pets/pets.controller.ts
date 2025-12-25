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
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
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
  @ApiBody({ type: CreatePetDto })
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
  @ApiOperation({ summary: 'Update pet information' })
  @ApiBody({ type: UpdatePetDto })
  @ApiResponse({ status: 200, description: 'Pet updated successfully' })
  @ApiResponse({ status: 404, description: 'Pet not found' })
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
  @ApiOperation({ summary: 'Set pet lost status' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isLost: { type: 'boolean', example: true, description: 'Whether the pet is lost' },
      },
      required: ['isLost'],
    },
  })
  @ApiResponse({ status: 200, description: 'Lost status updated successfully' })
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
  @ApiOperation({ summary: 'Report a found pet (public endpoint)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        lat: { type: 'number', example: 23.8103, description: 'Latitude' },
        lng: { type: 'number', example: 90.4125, description: 'Longitude' },
        address: { type: 'string', example: '123 Main Street, Dhaka', description: 'Address where pet was found' },
        note: { type: 'string', example: 'Found near the park', description: 'Additional notes' },
        imageUrl: { type: 'string', example: 'https://example.com/image.jpg', description: 'Image URL' },
        phone: { type: 'string', example: '01712345678', description: 'Contact phone (Bangladesh format)' },
      },
      required: ['lat', 'lng', 'address', 'phone'],
    },
  })
  @ApiResponse({ status: 200, description: 'Found report submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input - address and phone are required' })
  @HttpCode(HttpStatus.OK)
  async reportFound(
    @Param('id') id: string,
    @Body() body: { lat: number; lng: number; address?: string; note?: string; imageUrl?: string; phone?: string },
  ) {
    if (!body.address) {
      throw new BadRequestException('Address is required when reporting a found pet.');
    }
    if (!body.phone) {
      throw new BadRequestException('Phone number is required when reporting a found pet.');
    }
    const bdPhoneRegex = /^(?:\+8801\d{9}|01\d{9})$/;
    if (!bdPhoneRegex.test(body.phone)) {
      throw new BadRequestException('Phone must be a valid Bangladesh number (01XXXXXXXXX or +8801XXXXXXXXX).');
    }

    // This endpoint is public - anyone can report finding a lost pet
    // The notification service will handle notifying the owner
    return this.petService.reportFound(
      id,
      body.lat,
      body.lng,
      body.address,
      body.note,
      body.imageUrl,
      body.phone,
    );
  }
}

