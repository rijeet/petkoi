import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../APP.Infrastructure/prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import * as ngeohash from 'ngeohash';
import { GPSService } from './gps.service';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private gpsService: GPSService,
  ) {}

  /**
   * Broadcast lost pet alert to nearby users
   * This is a skeleton implementation - can be extended with push/email notifications
   */
  async broadcastLostPet(petId: string): Promise<void> {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!pet || !pet.isLost) {
      return;
    }

    // Get last known location
    const lastLocation = await this.gpsService.getLastLocation(petId);

    if (!lastLocation) {
      // No location data, can't broadcast to nearby users
      console.warn(`Cannot broadcast lost pet ${petId}: no GPS location data`);
      return;
    }

    // Find nearby pets (and their owners) within 2km radius
    const nearbyPets = await this.gpsService.findNearbyPets(
      lastLocation.lat,
      lastLocation.lng,
      2, // 2km radius
    );

    // Get unique user IDs (excluding the pet owner)
    const userIds = new Set<string>();
    nearbyPets.forEach((nearbyPet) => {
      if (nearbyPet.pet.ownerId && nearbyPet.pet.ownerId !== pet.ownerId) {
        userIds.add(nearbyPet.pet.ownerId);
      }
    });

    // Create notification entries for each nearby user
    const notifications = Array.from(userIds).map((userId) => ({
      userId,
      type: NotificationType.LOST_ALERT,
      payload: {
        petId: pet.id,
        petName: pet.name,
        petType: pet.type,
        lastSeenLocation: {
          lat: lastLocation.lat,
          lng: lastLocation.lng,
        },
        ownerName: pet.owner?.name,
        ownerEmail: pet.owner?.email,
        timestamp: new Date().toISOString(),
      },
      read: false,
    }));

    if (notifications.length > 0) {
      await this.prisma.notification.createMany({
        data: notifications,
      });

      console.log(
        `Broadcasted lost pet alert for ${pet.name} to ${notifications.length} nearby users`,
      );
    }

    // TODO: Send push notifications via FCM
    // TODO: Send email notifications via SendGrid
    // TODO: Queue notifications for async processing
  }

  /**
   * Notify pet owner when their pet is found
   */
  async notifyPetFound(
    petId: string,
    finderLocation: { lat: number; lng: number },
    address?: string,
    note?: string,
    imageUrl?: string,
  ): Promise<void> {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!pet || !pet.ownerId) {
      return;
    }

    // Generate geohash for the found location (precision 7 = ~150m accuracy)
    const geohash = ngeohash.encode(finderLocation.lat, finderLocation.lng, 7);

    // Create notification for pet owner
    // Build payload object, only including fields that have values
    const notificationPayload: any = {
      petId: pet.id,
      petName: pet.name,
      foundLocation: {
        lat: finderLocation.lat,
        lng: finderLocation.lng,
        geohash: geohash, // Add geohash for efficient spatial queries
      },
      timestamp: new Date().toISOString(),
    };

    // Only add optional fields if they have values
    if (address) {
      notificationPayload.address = address;
    }
    if (note) {
      notificationPayload.note = note;
    }
    if (imageUrl) {
      notificationPayload.imageUrl = imageUrl;
    }

    console.log(`Creating notification for ${pet.name}:`, {
      hasImageUrl: !!imageUrl,
      imageUrl: imageUrl?.substring(0, 100),
      imageUrlFull: imageUrl, // Log full URL for debugging
      payload: notificationPayload,
      payloadKeys: Object.keys(notificationPayload),
    });

    const createdNotification = await this.prisma.notification.create({
      data: {
        userId: pet.ownerId,
        type: NotificationType.LOST_PET_FOUND,
        payload: notificationPayload,
        read: false,
      },
    });

    // Verify the payload was saved correctly
    console.log('Notification created:', {
      id: createdNotification.id,
      payload: createdNotification.payload,
      hasImageUrlInPayload: !!(createdNotification.payload as any)?.imageUrl,
    });

    console.log(`Notified owner of ${pet.name} that pet was found`);

    // TODO: Send push notification
    // TODO: Send email notification
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, limit: number = 50, offset: number = 0) {
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.notification.count({
        where: { userId },
      }),
    ]);

    return {
      notifications,
      total,
      limit,
      offset,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId, // Ensure user owns the notification
      },
      data: {
        read: true,
      },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this notification');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }
}

