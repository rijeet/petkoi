import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { DonationService } from '../../APP.BLL/services/donation.service';
import { CreateDonationDto } from '../../APP.Shared/dtos/donation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('donations')
@ApiBearerAuth('JWT-auth')
@Controller('donations')
@UseGuards(JwtAuthGuard)
export class DonationsController {
  constructor(private readonly donationService: DonationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new donation' })
  @ApiBody({ type: CreateDonationDto })
  @ApiResponse({ status: 201, description: 'Donation created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @HttpCode(HttpStatus.CREATED)
  async createDonation(
    @Body() createDonationDto: CreateDonationDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.donationService.createDonation(user.sub, createDonationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all donations for the current user' })
  @ApiResponse({ status: 200, description: 'Donations retrieved successfully' })
  async getMyDonations(@CurrentUser() user: { sub: string }) {
    return this.donationService.getUserDonations(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific donation by ID' })
  @ApiResponse({ status: 200, description: 'Donation retrieved successfully' })
  @ApiResponse({ status: 403, description: 'You do not have permission to view this donation' })
  @ApiResponse({ status: 404, description: 'Donation not found' })
  async getDonationById(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.donationService.getDonationById(id, user.sub);
  }
}

