import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../APP.Infrastructure/prisma/prisma.service';
import { ImageKitService } from '../../APP.Infrastructure/imagekit/imagekit.service';
import { PetImage } from '@prisma/client';

@Injectable()
export class PetImageService {
  private readonly MAX_IMAGES_PER_PET = 5;

  constructor(
    private prisma: PrismaService,
    private imageKitService: ImageKitService,
  ) {}

  async uploadImage(
    petId: string,
    file: Express.Multer.File,
    uploadedBy: string,
    ownerId: string,
  ): Promise<PetImage> {
    // Validate file
    this.imageKitService.validateImageFile(file);

    // Check if pet exists and user owns it
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    if (pet.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to upload images for this pet');
    }

    // Check image limit
    const imageCount = await this.prisma.petImage.count({
      where: { petId },
    });

    if (imageCount >= this.MAX_IMAGES_PER_PET) {
      throw new BadRequestException(
        `Maximum ${this.MAX_IMAGES_PER_PET} images allowed per pet`,
      );
    }

    // Upload to ImageKit
    // Note: Custom metadata is optional and requires fields to be defined in ImageKit dashboard
    // If you encounter "Invalid custom metadata" errors, you can:
    // 1. Define custom metadata fields in ImageKit dashboard (petId, ownerId, uploadedBy)
    // 2. Or remove the customMetadata parameter below to upload without it
    let uploadResult;
    try {
      // Try with custom metadata first
      uploadResult = await this.imageKitService.uploadFile(
        file.buffer,
        file.originalname,
        `/pets/${petId}/`,
        ['pet', petId],
        {
          petId: String(petId),
          ownerId: String(ownerId),
          uploadedBy: 'user',
        },
      );
    } catch (error: unknown) {
      // If custom metadata fails, retry without it
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('custom metadata') || errorMessage.includes('Invalid custom metadata')) {
        console.warn('Custom metadata not configured in ImageKit, uploading without metadata');
        uploadResult = await this.imageKitService.uploadFile(
          file.buffer,
          file.originalname,
          `/pets/${petId}/`,
          ['pet', petId],
          // Upload without custom metadata
          undefined,
        );
      } else {
        // Re-throw other errors
        throw error;
      }
    }

    // Save to database
    try {
      return await this.prisma.petImage.create({
        data: {
          petId,
          url: uploadResult.url,
          fileId: uploadResult.fileId,
          uploadedBy,
          metadata: {
            name: uploadResult.name,
            size: uploadResult.size,
            fileType: uploadResult.fileType,
          },
        },
      });
    } catch (error: unknown) {
      // If database save fails, try to clean up ImageKit file
      try {
        await this.imageKitService.deleteFile(uploadResult.fileId);
      } catch (cleanupError) {
        console.error('Failed to cleanup ImageKit file after database error:', cleanupError);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error saving image to database';
      throw new BadRequestException(`Failed to save image: ${errorMessage}`);
    }
  }

  async deleteImage(imageId: string, ownerId: string): Promise<void> {
    const image = await this.prisma.petImage.findUnique({
      where: { id: imageId },
      include: { pet: true },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    if (image.pet.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to delete this image');
    }

    // Delete from ImageKit
    try {
      await this.imageKitService.deleteFile(image.fileId);
    } catch (error: unknown) {
      // Log error but continue with database deletion
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to delete from ImageKit:', errorMessage);
      // Don't throw - we still want to delete from database even if ImageKit fails
    }

    // Delete from database
    await this.prisma.petImage.delete({
      where: { id: imageId },
    });
  }

  async getPetImages(petId: string): Promise<PetImage[]> {
    return this.prisma.petImage.findMany({
      where: { petId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getImageById(imageId: string): Promise<PetImage | null> {
    return this.prisma.petImage.findUnique({
      where: { id: imageId },
    });
  }

  /**
   * Upload image for found pet report (public endpoint)
   * Returns just the ImageKit URL without saving to database
   */
  async uploadFoundPetImage(petId: string, file: Express.Multer.File): Promise<{ url: string }> {
    // Validate file
    this.imageKitService.validateImageFile(file);

    // Check if pet exists
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    // Upload to ImageKit (don't save to database - this is just for found pet reports)
    // Note: Custom metadata is optional and requires fields to be defined in ImageKit dashboard
    // If you encounter "Invalid custom metadata" errors, you can:
    // 1. Define custom metadata fields in ImageKit dashboard (petId, uploadedBy, type)
    // 2. Or the upload will automatically retry without custom metadata
    let uploadResult;
    try {
      // Try with custom metadata first
      uploadResult = await this.imageKitService.uploadFile(
        file.buffer,
        `found-${Date.now()}-${file.originalname}`,
        `/pets/${petId}/found/`,
        ['pet', petId, 'found'],
        {
          petId: String(petId),
          uploadedBy: 'finder',
          type: 'found-report',
        },
      );
    } catch (error: unknown) {
      // If custom metadata fails, retry without it
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('custom metadata') || errorMessage.includes('Invalid custom metadata')) {
        console.warn('Custom metadata not configured in ImageKit for found pet image, uploading without metadata');
        uploadResult = await this.imageKitService.uploadFile(
          file.buffer,
          `found-${Date.now()}-${file.originalname}`,
          `/pets/${petId}/found/`,
          ['pet', petId, 'found'],
          // Upload without custom metadata
          undefined,
        );
      } else {
        // Re-throw other errors
        throw error;
      }
    }

    return {
      url: uploadResult.url,
    };
  }
}

