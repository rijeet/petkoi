import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PetService } from './pet.service';
import { PrismaService } from '../../APP.Infrastructure/prisma/prisma.service';
import { QRService } from './qr.service';
import { NotificationService } from './notification.service';
import { Gender, PetType } from '@prisma/client';

describe('PetService', () => {
  let service: PetService;
  let prisma: PrismaService;
  let qrService: QRService;
  let notificationService: NotificationService;

  const mockPrismaService = {
    pet: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockQRService = {
    getQRUrl: jest.fn(),
    generateQRCode: jest.fn(),
  };

  const mockNotificationService = {
    broadcastLostPet: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PetService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
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
    prisma = module.get<PrismaService>(PrismaService);
    qrService = module.get<QRService>(QRService);
    notificationService = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a pet with QR code URL', async () => {
      const createDto = {
        name: 'Fluffy',
        type: PetType.DOG,
        gender: Gender.MALE,
        neutered: false,
        ownerId: 'user-1',
      };

      const createdPet = {
        id: 'pet-1',
        ...createDto,
        qrCodeUrl: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedPet = {
        ...createdPet,
        qrCodeUrl: 'https://example.com/qr/pet-1',
      };

      mockQRService.getQRUrl.mockReturnValue('https://example.com/qr/pet-1');
      mockPrismaService.pet.create.mockResolvedValue(createdPet);
      mockPrismaService.pet.update.mockResolvedValue(updatedPet);

      const result = await service.create(createDto);

      expect(mockPrismaService.pet.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: createDto.name,
          type: createDto.type,
          ownerId: createDto.ownerId,
        }),
      });
      expect(mockQRService.getQRUrl).toHaveBeenCalledWith(createdPet.id);
      expect(mockPrismaService.pet.update).toHaveBeenCalled();
      expect(result.qrCodeUrl).toBe('https://example.com/qr/pet-1');
    });
  });

  describe('findById', () => {
    it('should return a pet by id', async () => {
      const pet = {
        id: 'pet-1',
        name: 'Fluffy',
        ownerId: 'user-1',
        images: [],
        vaccines: [],
      };

      mockPrismaService.pet.findUnique.mockResolvedValue(pet);

      const result = await service.findById('pet-1');

      expect(mockPrismaService.pet.findUnique).toHaveBeenCalledWith({
        where: { id: 'pet-1' },
        include: expect.any(Object),
      });
      expect(result).toEqual(pet);
    });

    it('should return null if pet not found', async () => {
      mockPrismaService.pet.findUnique.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('setLostStatus', () => {
    it('should update lost status and broadcast notification', async () => {
      const pet = {
        id: 'pet-1',
        ownerId: 'user-1',
        isLost: false,
      };

      const updatedPet = {
        ...pet,
        isLost: true,
      };

      mockPrismaService.pet.findUnique.mockResolvedValue(pet);
      mockPrismaService.pet.update.mockResolvedValue(updatedPet);
      mockNotificationService.broadcastLostPet.mockResolvedValue(undefined);

      const result = await service.setLostStatus('pet-1', 'user-1', true);

      expect(mockPrismaService.pet.update).toHaveBeenCalledWith({
        where: { id: 'pet-1' },
        data: { isLost: true },
      });
      expect(mockNotificationService.broadcastLostPet).toHaveBeenCalledWith('pet-1');
      expect(result.isLost).toBe(true);
    });

    it('should throw NotFoundException if pet not found', async () => {
      mockPrismaService.pet.findUnique.mockResolvedValue(null);

      await expect(service.setLostStatus('non-existent', 'user-1', true)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      const pet = {
        id: 'pet-1',
        ownerId: 'user-1',
      };

      mockPrismaService.pet.findUnique.mockResolvedValue(pet);

      await expect(service.setLostStatus('pet-1', 'user-2', true)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should update pet if user is owner', async () => {
      const pet = {
        id: 'pet-1',
        ownerId: 'user-1',
      };

      const updateDto = {
        name: 'Updated Name',
      };

      const updatedPet = {
        ...pet,
        ...updateDto,
      };

      mockPrismaService.pet.findUnique.mockResolvedValue(pet);
      mockPrismaService.pet.update.mockResolvedValue(updatedPet);

      const result = await service.update('pet-1', 'user-1', updateDto);

      expect(mockPrismaService.pet.update).toHaveBeenCalledWith({
        where: { id: 'pet-1' },
        data: updateDto,
      });
      expect(result.name).toBe('Updated Name');
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      const pet = {
        id: 'pet-1',
        ownerId: 'user-1',
      };

      mockPrismaService.pet.findUnique.mockResolvedValue(pet);

      await expect(service.update('pet-1', 'user-2', { name: 'New Name' })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});

