import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../APP.Infrastructure/prisma/prisma.service';
import { CreateGuardDto, UpdateGuardDto, CreateWasteCollectorDto, UpdateWasteCollectorDto } from '../../APP.Shared/dtos/directory.dto';
import { GPSService } from './gps.service';

@Injectable()
export class DirectoryService {
  constructor(
    private prisma: PrismaService,
    private gpsService: GPSService,
  ) {}

  // Guard Management

  /**
   * Create a new guard (admin only)
   */
  async createGuard(data: CreateGuardDto) {
    return this.prisma.guard.create({
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address,
      },
    });
  }

  /**
   * Get all guards
   */
  async getGuards(limit: number = 100, offset: number = 0) {
    const [guards, total] = await Promise.all([
      this.prisma.guard.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.guard.count(),
    ]);

    return {
      guards,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get a guard by ID
   */
  async getGuardById(guardId: string) {
    const guard = await this.prisma.guard.findUnique({
      where: { id: guardId },
    });

    if (!guard) {
      throw new NotFoundException('Guard not found');
    }

    return guard;
  }

  /**
   * Update a guard (admin only)
   */
  async updateGuard(guardId: string, data: UpdateGuardDto) {
    await this.getGuardById(guardId);

    return this.prisma.guard.update({
      where: { id: guardId },
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address,
      },
    });
  }

  /**
   * Delete a guard (admin only)
   */
  async deleteGuard(guardId: string) {
    await this.getGuardById(guardId);

    await this.prisma.guard.delete({
      where: { id: guardId },
    });
  }

  /**
   * Find nearby guards using geohash
   * Note: This requires address geocoding to convert addresses to lat/lng
   * For now, returns all guards (can be enhanced with geocoding service)
   */
  async findNearbyGuards(lat: number, lng: number, radiusKm: number = 5) {
    // TODO: Implement geocoding to convert guard addresses to lat/lng
    // For now, return all guards
    // In production, you would:
    // 1. Geocode guard addresses to get lat/lng
    // 2. Use GPSService.findNearbyPets logic to filter by distance
    // 3. Return guards within radius

    const guards = await this.prisma.guard.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return {
      guards,
      center: { lat, lng },
      radiusKm,
      note: 'Geocoding not implemented - returning all guards',
    };
  }

  // Waste Collector Management

  /**
   * Create a new waste collector (admin only)
   */
  async createWasteCollector(data: CreateWasteCollectorDto) {
    return this.prisma.wasteCollector.create({
      data: {
        name: data.name,
        phone: data.phone,
        ward: data.ward,
      },
    });
  }

  /**
   * Get all waste collectors
   */
  async getWasteCollectors(limit: number = 100, offset: number = 0) {
    const [collectors, total] = await Promise.all([
      this.prisma.wasteCollector.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.wasteCollector.count(),
    ]);

    return {
      collectors,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get a waste collector by ID
   */
  async getWasteCollectorById(collectorId: string) {
    const collector = await this.prisma.wasteCollector.findUnique({
      where: { id: collectorId },
    });

    if (!collector) {
      throw new NotFoundException('Waste collector not found');
    }

    return collector;
  }

  /**
   * Get waste collectors by ward
   */
  async getWasteCollectorsByWard(ward: string) {
    return this.prisma.wasteCollector.findMany({
      where: { ward },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update a waste collector (admin only)
   */
  async updateWasteCollector(collectorId: string, data: UpdateWasteCollectorDto) {
    await this.getWasteCollectorById(collectorId);

    return this.prisma.wasteCollector.update({
      where: { id: collectorId },
      data: {
        name: data.name,
        phone: data.phone,
        ward: data.ward,
      },
    });
  }

  /**
   * Delete a waste collector (admin only)
   */
  async deleteWasteCollector(collectorId: string) {
    await this.getWasteCollectorById(collectorId);

    await this.prisma.wasteCollector.delete({
      where: { id: collectorId },
    });
  }
}

