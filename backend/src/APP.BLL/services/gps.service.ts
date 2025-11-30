import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../APP.Infrastructure/prisma/prisma.service';
import * as ngeohash from 'ngeohash';

@Injectable()
export class GPSService {
  private readonly GEOHASH_PRECISION = 7; // ~150m accuracy

  constructor(private prisma: PrismaService) {}

  /**
   * Record GPS location for a pet
   * Generates geohash and stores location history
   */
  async recordLocation(
    petId: string,
    lat: number,
    lng: number,
    note?: string,
  ) {
    // Validate pet exists
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    // Generate geohash
    const geohash = ngeohash.encode(lat, lng, this.GEOHASH_PRECISION);

    // Store location history
    const location = await this.prisma.gPSLocationHistory.create({
      data: {
        petId,
        lat,
        lng,
        geohash,
      },
    });

    return location;
  }

  /**
   * Get GPS history for a pet
   */
  async getHistory(petId: string, limit: number = 100, offset: number = 0) {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    const [locations, total] = await Promise.all([
      this.prisma.gPSLocationHistory.findMany({
        where: { petId },
        orderBy: { recordedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.gPSLocationHistory.count({
        where: { petId },
      }),
    ]);

    return {
      locations,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get last known location for a pet
   */
  async getLastLocation(petId: string) {
    const location = await this.prisma.gPSLocationHistory.findFirst({
      where: { petId },
      orderBy: { recordedAt: 'desc' },
    });

    return location;
  }

  /**
   * Find nearby pets using geohash neighbors
   * Returns pets within approximate radius (based on geohash precision)
   */
  async findNearbyPets(lat: number, lng: number, radiusKm: number = 2) {
    // Calculate geohash precision based on radius
    // Precision 6 = ~1.2km, Precision 7 = ~150m
    const precision = radiusKm >= 1 ? 6 : 7;
    const centerGeohash = ngeohash.encode(lat, lng, precision);

    // Get geohash neighbors (8 surrounding cells + center)
    const neighbors = ngeohash.neighbors(centerGeohash);
    const searchGeohashes = [centerGeohash, ...neighbors];

    // Find recent locations (last 24 hours) with matching geohashes
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const locations = await this.prisma.gPSLocationHistory.findMany({
      where: {
        geohash: {
          in: searchGeohashes,
        },
        recordedAt: {
          gte: yesterday,
        },
      },
      include: {
        pet: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            images: {
              take: 1,
            },
          },
        },
      },
      orderBy: {
        recordedAt: 'desc',
      },
    });

    // Filter by actual distance (geohash is approximate)
    const nearbyPets = locations
      .map((loc) => {
        const distance = this.calculateDistance(lat, lng, loc.lat, loc.lng);
        return {
          ...loc,
          distanceKm: distance,
        };
      })
      .filter((loc) => loc.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return nearbyPets;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in kilometers
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}

