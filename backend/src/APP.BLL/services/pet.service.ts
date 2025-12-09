import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../APP.Infrastructure/prisma/prisma.service';
import { QRService } from './qr.service';
import { NotificationService } from './notification.service';
import { Pet, Gender, PetType } from '@prisma/client';

export interface CreatePetDto {
  name: string;
  breed?: string;
  color?: string;
  dateOfBirth?: Date;
  neutered: boolean;
  gender: Gender;
  description?: string;
  type: PetType;
  ownerId: string;
}

export interface UpdatePetDto {
  name?: string;
  type?: PetType;
  breed?: string;
  color?: string;
  dateOfBirth?: Date;
  neutered?: boolean;
  gender?: Gender | string; // Allow string for DTO validation, will be cast to Gender
  description?: string;
  isLost?: boolean;
}

@Injectable()
export class PetService {
  constructor(
    private prisma: PrismaService,
    private qrService: QRService,
    private notificationService: NotificationService,
  ) {}

  async create(data: CreatePetDto): Promise<Pet> {
    // Generate QR code URL
    const pet = await this.prisma.pet.create({
      data: {
        name: data.name,
        breed: data.breed,
        color: data.color,
        dateOfBirth: data.dateOfBirth,
        neutered: data.neutered,
        gender: data.gender,
        description: data.description,
        type: data.type,
        ownerId: data.ownerId,
        qrCodeUrl: this.qrService.getQRUrl(''), // Will be updated after creation
      },
    });

    // Update with actual QR code URL
    const qrCodeUrl = this.qrService.getQRUrl(pet.id);
    return this.prisma.pet.update({
      where: { id: pet.id },
      data: { qrCodeUrl },
    });
  }

  async findById(id: string): Promise<Pet | null> {
    return this.prisma.pet.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        images: true,
        vaccines: true,
      },
    });
  }

  async findByOwnerId(ownerId: string): Promise<Pet[]> {
    return this.prisma.pet.findMany({
      where: { ownerId },
      include: {
        images: {
          take: 1, // Get first image for thumbnail
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, userId: string, data: UpdatePetDto): Promise<Pet> {
    const pet = await this.findById(id);
    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    // Check ownership
    if (pet.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to update this pet');
    }

    // Cast to any to satisfy Prisma's strict enum types
    // The DTO validation ensures the values are correct enum values
    return this.prisma.pet.update({
      where: { id },
      data: data as any,
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const pet = await this.findById(id);
    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    // Check ownership
    if (pet.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this pet');
    }

    await this.prisma.pet.delete({
      where: { id },
    });
  }

  async setLostStatus(id: string, userId: string, isLost: boolean): Promise<Pet> {
    const pet = await this.findById(id);
    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    // Check ownership
    if (pet.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to update this pet');
    }

    const updatedPet = await this.prisma.pet.update({
      where: { id },
      data: { isLost },
    });

    // Broadcast lost pet alert if pet is marked as lost
    if (isLost) {
      // Fire and forget - don't wait for notification broadcast
      this.notificationService.broadcastLostPet(id).catch((error) => {
        console.error(`Failed to broadcast lost pet alert for ${id}:`, error);
      });
    }

    return updatedPet;
  }

  async getPublicProfile(id: string): Promise<Pet | null> {
    const pet = await this.prisma.pet.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true, // Phone included - frontend will conditionally display based on isLost
            homeAddress: true,
          },
        },
        images: true,
        vaccines: {
          orderBy: { injectionDate: 'desc' },
        },
      },
    });

    // Only return owner contact info if pet is lost (privacy protection)
    if (pet && pet.owner && !pet.isLost) {
      // Remove contact info for privacy when pet is not lost
      pet.owner = {
        ...pet.owner,
        email: null as any,
        phone: null as any,
        homeAddress: null as any,
      };
    }

    return pet;
  }

  async generateQRCode(petId: string): Promise<string> {
    const pet = await this.findById(petId);
    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    return this.qrService.generateQRCode(petId);
  }

  async reportFound(
    petId: string,
    lat: number,
    lng: number,
    address?: string,
    note?: string,
    imageUrl?: string,
    phone?: string,
  ): Promise<{ success: boolean }> {
    const pet = await this.findById(petId);
    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    // Record the found location with address and image
    await this.notificationService.notifyPetFound(petId, { lat, lng }, address, note, imageUrl, phone);

    return { success: true };
  }
}

