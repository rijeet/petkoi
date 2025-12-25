import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../APP.Infrastructure/prisma/prisma.service';
import { NotificationService } from './notification.service';
import { CreateDonationDto, VerifyDonationDto, DonationStatus } from '../../APP.Shared/dtos/donation.dto';
import { Donation } from '@prisma/client';

@Injectable()
export class DonationService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async createDonation(userId: string, createDonationDto: CreateDonationDto): Promise<Donation> {
    return this.prisma.donation.create({
      data: {
        userId,
        method: createDonationDto.method,
        amountBDT: createDonationDto.amountBDT,
        currency: 'BDT',
        trxId: createDonationDto.trxId,
        agentAccount: createDonationDto.agentAccount,
        contactNumber: createDonationDto.contactNumber,
        note: createDonationDto.note,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async getUserDonations(userId: string): Promise<Donation[]> {
    return this.prisma.donation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDonationById(donationId: string, userId?: string): Promise<Donation> {
    const donation = await this.prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!donation) {
      throw new NotFoundException('Donation not found');
    }

    // If userId provided, check ownership
    if (userId && donation.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view this donation');
    }

    return donation;
  }

  async getAllDonations(status?: DonationStatus): Promise<Donation[]> {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    return this.prisma.donation.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDonationStats(): Promise<{
    totalDonations: number;
    totalAmount: number;
    verifiedAmount: number;
    pendingAmount: number;
    verifiedCount: number;
    pendingCount: number;
  }> {
    const [totalDonations, verifiedDonations, pendingDonations] = await Promise.all([
      this.prisma.donation.count(),
      this.prisma.donation.findMany({
        where: { status: 'VERIFIED' },
        select: { amountBDT: true },
      }),
      this.prisma.donation.findMany({
        where: { status: 'PENDING' },
        select: { amountBDT: true },
      }),
    ]);

    const verifiedAmount = verifiedDonations.reduce((sum, d) => sum + d.amountBDT, 0);
    const pendingAmount = pendingDonations.reduce((sum, d) => sum + d.amountBDT, 0);
    const totalAmount = verifiedAmount + pendingAmount;

    return {
      totalDonations,
      totalAmount,
      verifiedAmount,
      pendingAmount,
      verifiedCount: verifiedDonations.length,
      pendingCount: pendingDonations.length,
    };
  }

  async verifyDonation(
    donationId: string,
    verifyDonationDto: VerifyDonationDto,
    adminId: string,
  ): Promise<Donation> {
    const donation = await this.prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!donation) {
      throw new NotFoundException('Donation not found');
    }

    if (donation.status !== 'PENDING') {
      throw new BadRequestException(`Donation is already ${donation.status.toLowerCase()}`);
    }

    const updateData: any = {
      status: verifyDonationDto.status,
      verifiedBy: adminId,
      verifiedAt: new Date(),
    };

    // If rejected, add note
    if (verifyDonationDto.note) {
      updateData.note = donation.note
        ? `${donation.note}\n[Admin]: ${verifyDonationDto.note}`
        : `[Admin]: ${verifyDonationDto.note}`;
    }

    const updatedDonation = await this.prisma.donation.update({
      where: { id: donationId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Send notification to user if verified
    if (verifyDonationDto.status === 'VERIFIED') {
      await this.notificationService.createNotification(
        donation.userId,
        'DONATION_VERIFIED',
        {
          donationId: donation.id,
          amount: donation.amountBDT,
          method: donation.method,
          message: `Thank you for your generous donation of ${donation.amountBDT} BDT! Your contribution helps us continue our mission. We truly appreciate your support! 🙏`,
        },
      );
    } else if (verifyDonationDto.status === 'REJECTED') {
      await this.notificationService.createNotification(
        donation.userId,
        'DONATION_REJECTED',
        {
          donationId: donation.id,
          amount: donation.amountBDT,
          method: donation.method,
          reason: verifyDonationDto.note || 'Payment verification failed',
          message: `Your donation of ${donation.amountBDT} BDT could not be verified. Please contact support if you believe this is an error.`,
        },
      );
    }

    return updatedDonation;
  }
}

