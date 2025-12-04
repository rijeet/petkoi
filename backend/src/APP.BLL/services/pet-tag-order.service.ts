import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../APP.Infrastructure/prisma/prisma.service';
import { PetService } from './pet.service';
import { PetTagPreviewService } from './pet-tag-preview.service';
import { CreatePetTagOrderDto, PetTagOrderStatus } from '../../APP.Shared/dtos/pet-tag.dto';
import { PetTagOrder, Prisma } from '@prisma/client';

@Injectable()
export class PetTagOrderService {
  constructor(
    private prisma: PrismaService,
    private petService: PetService,
    private tagPreviewService: PetTagPreviewService,
  ) {}

  /**
   * Create a new pet tag order
   */
  async createOrder(userId: string, dto: CreatePetTagOrderDto): Promise<PetTagOrder> {
    // Verify pet exists and user owns it
    const pet = await this.petService.findById(dto.petId);
    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    if (pet.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to order a tag for this pet');
    }

    // Verify pet has QR code
    if (!pet.qrCodeUrl) {
      throw new BadRequestException('Pet must have a QR code before ordering a tag');
    }

    // Create order
    const order = await this.prisma.petTagOrder.create({
      data: {
        petId: dto.petId,
        userId,
        qrUrl: pet.qrCodeUrl,
        tagColor: dto.tagColor,
        tagSize: dto.tagSize || '32mm',
        status: PetTagOrderStatus.PENDING,
      },
    });

    // Generate preview asynchronously (don't block order creation)
    this.generatePreviewAsync(order.id, pet.qrCodeUrl, dto.tagColor, dto.petId, pet.name).catch(
      (error) => {
        console.error(`Failed to generate preview for order ${order.id}:`, error);
      },
    );

    return order;
  }

  /**
   * Generate preview (front side) asynchronously and update order
   */
  private async generatePreviewAsync(
    orderId: string,
    qrCodeUrl: string,
    tagColor: string,
    petId: string,
    petName?: string,
  ): Promise<void> {
    try {
      const previewUrl = await this.tagPreviewService.generateAndUploadPreview(
        qrCodeUrl,
        tagColor as any,
        petId,
        orderId,
        petName,
      );

      // Also generate back side (optional, can be stored separately if needed)
      this.tagPreviewService.generateAndUploadBackSide(
        tagColor as any,
        petId,
        orderId,
      ).catch((error) => {
        console.error(`Error generating back side for order ${orderId}:`, error);
      });

      await this.prisma.petTagOrder.update({
        where: { id: orderId },
        data: { previewUrl },
      });
    } catch (error) {
      console.error(`Error generating preview for order ${orderId}:`, error);
      // Don't throw - preview generation failure shouldn't break the order
    }
  }

  /**
   * Get all orders for a user
   */
  async getMyOrders(userId: string): Promise<(PetTagOrder & { pet: any })[]> {
    return this.prisma.petTagOrder.findMany({
      where: { userId },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            type: true,
            breed: true,
            images: {
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a specific order by ID
   */
  async getOrderById(orderId: string, userId: string): Promise<PetTagOrder & { pet: any }> {
    const order = await this.prisma.petTagOrder.findUnique({
      where: { id: orderId },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            type: true,
            breed: true,
            color: true,
            images: {
              take: 1,
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only allow user to view their own orders (unless admin)
    if (order.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view this order');
    }

    return order;
  }

  /**
   * Update order status (admin only in production, but allowing for now)
   */
  async updateOrderStatus(
    orderId: string,
    status: PetTagOrderStatus,
    userId: string,
  ): Promise<PetTagOrder> {
    const order = await this.prisma.petTagOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only allow user to update their own orders (or admin)
    // In production, add admin check here
    if (order.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this order');
    }

    return this.prisma.petTagOrder.update({
      where: { id: orderId },
      data: { status },
    });
  }
}

