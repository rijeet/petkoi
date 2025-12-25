import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { DonationService } from '../../APP.BLL/services/donation.service';
import { VerifyDonationDto, DonationStatus } from '../../APP.Shared/dtos/donation.dto';
import { AdminAccessGuard } from '../../common/guards/admin-access.guard';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin/donations')
@UseGuards(AdminAccessGuard)
export class AdminDonationsController {
  constructor(private readonly donationService: DonationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all donations with optional status filter (admin)' })
  @ApiResponse({ status: 200, description: 'Donations retrieved successfully' })
  async getAllDonations(@Query('status') status?: DonationStatus) {
    return this.donationService.getAllDonations(status);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get donation statistics and calculations (admin)' })
  @ApiResponse({ status: 200, description: 'Donation statistics retrieved successfully' })
  async getDonationStats() {
    return this.donationService.getDonationStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific donation by ID (admin)' })
  @ApiResponse({ status: 200, description: 'Donation retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Donation not found' })
  async getDonationById(@Param('id') id: string) {
    return this.donationService.getDonationById(id);
  }

  @Patch(':id/verify')
  @ApiOperation({ summary: 'Verify or reject a donation (admin)' })
  @ApiBody({ type: VerifyDonationDto })
  @ApiResponse({ status: 200, description: 'Donation verification updated successfully' })
  @ApiResponse({ status: 400, description: 'Donation is already verified/rejected' })
  @ApiResponse({ status: 404, description: 'Donation not found' })
  @HttpCode(HttpStatus.OK)
  async verifyDonation(
    @Param('id') id: string,
    @Body() verifyDonationDto: VerifyDonationDto,
    @CurrentAdmin() admin: { sub: string },
  ) {
    return this.donationService.verifyDonation(id, verifyDonationDto, admin.sub);
  }
}

