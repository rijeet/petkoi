import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../APP.Infrastructure/prisma/prisma.service';
import { ImageKitService } from '../../APP.Infrastructure/imagekit/imagekit.service';
import { CreateVaccineDto, UpdateVaccineDto } from '../../APP.Shared/dtos/vaccine.dto';
import { Vaccine } from '@prisma/client';

@Injectable()
export class VaccineService {
  constructor(
    private prisma: PrismaService,
    private imageKitService: ImageKitService,
  ) {}

  async createVaccine(
    petId: string,
    createVaccineDto: CreateVaccineDto,
    ownerId: string,
  ): Promise<Vaccine> {
    // Check if pet exists and user owns it
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    if (pet.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to add vaccines for this pet');
    }

    return this.prisma.vaccine.create({
      data: {
        petId,
        name: createVaccineDto.name,
        doseNumber: createVaccineDto.doseNumber,
        clinic: createVaccineDto.clinic,
        injectionDate: new Date(createVaccineDto.injectionDate),
        nextDueDate: createVaccineDto.nextDueDate ? new Date(createVaccineDto.nextDueDate) : null,
      },
    });
  }

  async uploadPrescriptionImage(
    vaccineId: string,
    file: Express.Multer.File,
    ownerId: string,
  ): Promise<Vaccine> {
    // Validate file
    this.imageKitService.validateImageFile(file);

    // Check if vaccine exists and user owns the pet
    const vaccine = await this.prisma.vaccine.findUnique({
      where: { id: vaccineId },
      include: { pet: true },
    });

    if (!vaccine) {
      throw new NotFoundException('Vaccine record not found');
    }

    if (vaccine.pet.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to upload prescription for this vaccine');
    }

    // Delete old prescription image if exists
    if (vaccine.prescriptionImageUrl) {
      try {
        const meta = (vaccine.extractedMeta as Record<string, any>) || {};
        const fileId = meta.prescriptionFileId;
        
        if (fileId) {
          await this.imageKitService.deleteFile(fileId);
        }
      } catch (error) {
        console.error('Failed to delete old prescription image from ImageKit:', error);
        // Continue with new upload even if old deletion fails
      }
    }

    // Upload to ImageKit
    let uploadResult;
    try {
      uploadResult = await this.imageKitService.uploadFile(
        file.buffer,
        `vaccine-${vaccineId}-prescription-${Date.now()}.${file.originalname.split('.').pop()}`,
        `/vaccines/prescriptions/`,
        ['vaccine', 'prescription', vaccine.petId],
        {
          vaccineId: String(vaccineId),
          petId: String(vaccine.petId),
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
          `vaccine-${vaccineId}-prescription-${Date.now()}.${file.originalname.split('.').pop()}`,
          `/vaccines/prescriptions/`,
          ['vaccine', 'prescription', vaccine.petId],
          undefined,
        );
      } else {
        throw new BadRequestException(
          error instanceof Error ? error.message : 'Failed to upload prescription image',
        );
      }
    }

    // Update vaccine with prescription image URL and store fileId in extractedMeta
    const existingMeta = (vaccine.extractedMeta as Record<string, any>) || {};
    return this.prisma.vaccine.update({
      where: { id: vaccineId },
      data: {
        prescriptionImageUrl: uploadResult.url,
        extractedMeta: {
          ...existingMeta,
          prescriptionFileId: uploadResult.fileId,
          prescriptionFileName: uploadResult.name,
          prescriptionFileSize: uploadResult.size,
          prescriptionFileType: uploadResult.fileType,
        },
      },
    });
  }

  async getPetVaccines(petId: string, ownerId?: string): Promise<Vaccine[]> {
    // Check if pet exists
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    // If ownerId provided, check ownership
    if (ownerId && pet.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to view vaccines for this pet');
    }

    return this.prisma.vaccine.findMany({
      where: { petId },
      orderBy: { injectionDate: 'desc' },
    });
  }

  async getVaccineById(vaccineId: string, ownerId?: string): Promise<Vaccine> {
    const vaccine = await this.prisma.vaccine.findUnique({
      where: { id: vaccineId },
      include: { pet: true },
    });

    if (!vaccine) {
      throw new NotFoundException('Vaccine record not found');
    }

    // If ownerId provided, check ownership
    if (ownerId && vaccine.pet.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to view this vaccine record');
    }

    return vaccine;
  }

  async updateVaccine(
    vaccineId: string,
    updateVaccineDto: UpdateVaccineDto,
    ownerId: string,
  ): Promise<Vaccine> {
    const vaccine = await this.prisma.vaccine.findUnique({
      where: { id: vaccineId },
      include: { pet: true },
    });

    if (!vaccine) {
      throw new NotFoundException('Vaccine record not found');
    }

    if (vaccine.pet.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to update this vaccine record');
    }

    const updateData: any = {};
    if (updateVaccineDto.name !== undefined) {
      updateData.name = updateVaccineDto.name;
    }
    if (updateVaccineDto.doseNumber !== undefined) {
      updateData.doseNumber = updateVaccineDto.doseNumber;
    }
    if (updateVaccineDto.clinic !== undefined) {
      updateData.clinic = updateVaccineDto.clinic;
    }
    if (updateVaccineDto.injectionDate !== undefined) {
      updateData.injectionDate = new Date(updateVaccineDto.injectionDate);
    }
    if (updateVaccineDto.nextDueDate !== undefined) {
      updateData.nextDueDate = updateVaccineDto.nextDueDate ? new Date(updateVaccineDto.nextDueDate) : null;
    }

    return this.prisma.vaccine.update({
      where: { id: vaccineId },
      data: updateData,
    });
  }

  async deletePrescriptionImage(vaccineId: string, ownerId: string): Promise<Vaccine> {
    const vaccine = await this.prisma.vaccine.findUnique({
      where: { id: vaccineId },
      include: { pet: true },
    });

    if (!vaccine) {
      throw new NotFoundException('Vaccine record not found');
    }

    if (vaccine.pet.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to delete prescription for this vaccine record');
    }

    if (!vaccine.prescriptionImageUrl) {
      throw new BadRequestException('No prescription image to delete');
    }

    // Delete prescription image from ImageKit if exists
    try {
      const meta = (vaccine.extractedMeta as Record<string, any>) || {};
      const fileId = meta.prescriptionFileId;
      
      if (fileId) {
        await this.imageKitService.deleteFile(fileId);
      }
    } catch (error) {
      console.error('Failed to delete prescription image from ImageKit:', error);
      // Continue with database update even if ImageKit deletion fails
    }

    // Remove prescription image URL and fileId from metadata
    const existingMeta = (vaccine.extractedMeta as Record<string, any>) || {};
    const { prescriptionFileId, prescriptionFileName, prescriptionFileSize, prescriptionFileType, ...restMeta } = existingMeta;

    return this.prisma.vaccine.update({
      where: { id: vaccineId },
      data: {
        prescriptionImageUrl: null,
        extractedMeta: restMeta,
      },
    });
  }

  async deleteVaccine(vaccineId: string, ownerId: string): Promise<void> {
    const vaccine = await this.prisma.vaccine.findUnique({
      where: { id: vaccineId },
      include: { pet: true },
    });

    if (!vaccine) {
      throw new NotFoundException('Vaccine record not found');
    }

    if (vaccine.pet.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to delete this vaccine record');
    }

    // Delete prescription image from ImageKit if exists
    if (vaccine.prescriptionImageUrl) {
      try {
        // Extract fileId from extractedMeta or try to get it from URL
        const meta = (vaccine.extractedMeta as Record<string, any>) || {};
        const fileId = meta.prescriptionFileId;
        
        if (fileId) {
          await this.imageKitService.deleteFile(fileId);
        } else {
          console.warn('FileId not found in metadata, skipping ImageKit deletion');
        }
      } catch (error) {
        // Log error but don't fail the deletion
        console.error('Failed to delete prescription image from ImageKit:', error);
      }
    }

    await this.prisma.vaccine.delete({
      where: { id: vaccineId },
    });
  }
}

