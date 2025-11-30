import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PetService } from '../../../src/APP.BLL/services/pet.service';
import { PrismaService } from '../../../src/APP.Infrastructure/prisma/prisma.service';
import { QRService } from '../../../src/APP.BLL/services/qr.service';
import { NotificationService } from '../../../src/APP.BLL/services/notification.service';
import { mockPrismaClient } from '../../globals';

describe('PetService', () => {
  let service: PetService;
  let prismaService: jest.Mocked<PrismaService>;
  let qrService: jest.Mocked<QRService>;
  let notificationService: jest.Mocked<NotificationService>;

  beforeEach(async () => {
    const mockQRService = {
      getQRUrl: jest.fn().mockReturnValue('https://example.com/qr/test-id'),
      generateQRCode: jest.fn().mockResolvedValue('qr-code-data'),
    };

    const mockNotificationService = {
      broadcastLostPet: jest.fn().mockResolvedValue(undefined),
      notifyPetFound: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PetService,
        {
          provide: PrismaService,
          useValue: mockPrismaClient,
        },
        {
          provide: QRService,
          useValue: mockQRService,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    service = module.get<PetService>(PetService);
    prismaService = module.get(PrismaService);
    qrService = module.get(QRService);
    notificationService = module.get(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a pet with QR code', async () => {
      const createPetDto = {
        name: 'Fluffy',
        breed: 'Golden Retriever',
        color: 'Golden',
        dateOfBirth: new Date('2020-01-01'),
        neutered: true,
        gender: 'MALE' as const,
        description: 'Friendly dog',
        type: 'DOG' as const,
        ownerId: 'owner-id',
      };

      const mockPet = {
        id: 'pet-id',
        ...createPetDto,
        qrCodeUrl: 'https://example.com/qr/pet-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        isLost: false,
      };

      (prismaService.pet.create as jest.Mock).mockResolvedValue(mockPet);
      (prismaService.pet.update as jest.Mock).mockResolvedValue(mockPet);

      const result = await service.create(createPetDto);

      expect(prismaService.pet.create).toHaveBeenCalled();
      expect(prismaService.pet.update).toHaveBeenCalled();
      expect(result).toEqual(mockPet);
    });
  });

  describe('findById', () => {
    it('should return a pet by id', async () => {
      const mockPet = {
        id: 'pet-id',
        name: 'Fluffy',
        owner: { id: 'owner-id', name: 'Owner', email: 'owner@example.com' },
        images: [],
        vaccines: [],
      };

      (prismaService.pet.findUnique as jest.Mock).mockResolvedValue(mockPet);

      const result = await service.findById('pet-id');

      expect(result).toEqual(mockPet);
      expect(prismaService.pet.findUnique).toHaveBeenCalledWith({
        where: { id: 'pet-id' },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          images: true,
          vaccines: true,
        },
      });
    });

    it('should return null if pet not found', async () => {
      (prismaService.pet.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a pet if user is owner', async () => {
      const mockPet = {
        id: 'pet-id',
        ownerId: 'user-id',
        name: 'Fluffy',
      };

      const updateData = {
        name: 'Fluffy Updated',
      };

      (prismaService.pet.findUnique as jest.Mock).mockResolvedValue(mockPet);
      (prismaService.pet.update as jest.Mock).mockResolvedValue({
        ...mockPet,
        ...updateData,
      });

      const result = await service.update('pet-id', 'user-id', updateData);

      expect(result.name).toBe('Fluffy Updated');
      expect(prismaService.pet.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if pet not found', async () => {
      (prismaService.pet.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.update('non-existent-id', 'user-id', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      const mockPet = {
        id: 'pet-id',
        ownerId: 'other-user-id',
      };

      (prismaService.pet.findUnique as jest.Mock).mockResolvedValue(mockPet);

      await expect(service.update('pet-id', 'user-id', {})).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('setLostStatus', () => {
    it('should set lost status and broadcast notification', async () => {
      const mockPet = {
        id: 'pet-id',
        ownerId: 'user-id',
        isLost: false,
      };

      (prismaService.pet.findUnique as jest.Mock).mockResolvedValue(mockPet);
      (prismaService.pet.update as jest.Mock).mockResolvedValue({
        ...mockPet,
        isLost: true,
      });

      const result = await service.setLostStatus('pet-id', 'user-id', true);

      expect(result.isLost).toBe(true);
      expect(notificationService.broadcastLostPet).toHaveBeenCalledWith('pet-id');
    });
  });
});

