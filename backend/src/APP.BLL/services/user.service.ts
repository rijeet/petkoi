import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../APP.Infrastructure/prisma/prisma.service';
import { User, Role } from '@prisma/client';

export interface CreateUserDto {
  email: string;
  name?: string;
  googleId?: string;
  profilePicture?: string;
  role?: Role;
}

export interface UpdateUserDto {
  name?: string;
  phone?: string;
  profilePicture?: string;
  role?: Role;
}

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUserDto): Promise<User> {
    // Check if user with email already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    // Check if user with googleId already exists
    if (data.googleId) {
      const existingGoogle = await this.prisma.user.findUnique({
        where: { googleId: data.googleId },
      });

      if (existingGoogle) {
        throw new ConflictException('User with this Google ID already exists');
      }
    }

    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        googleId: data.googleId,
        profilePicture: data.profilePicture,
        role: data.role || Role.USER,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { googleId },
    });
  }

  async findOrCreateByGoogle(googleData: {
    googleId: string;
    email: string;
    name?: string;
    profilePicture?: string;
  }): Promise<User> {
    // Try to find existing user by Google ID
    let user = await this.findByGoogleId(googleData.googleId);

    if (user) {
      // Update name and profile picture if provided and different
      const updateData: any = {};
      if (googleData.name && user.name !== googleData.name) {
        updateData.name = googleData.name;
      }
      if (googleData.profilePicture && user.profilePicture !== googleData.profilePicture) {
        updateData.profilePicture = googleData.profilePicture;
      }
      if (Object.keys(updateData).length > 0) {
        user = await this.update(user.id, updateData);
      }
      return user;
    }

    // Try to find by email
    user = await this.findByEmail(googleData.email);

    if (user) {
      // Link Google ID to existing user and update profile picture
      return this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleData.googleId,
          name: googleData.name || user.name,
          profilePicture: googleData.profilePicture || user.profilePicture,
        },
      });
    }

    // Create new user
    return this.create({
      email: googleData.email,
      name: googleData.name,
      googleId: googleData.googleId,
      profilePicture: googleData.profilePicture,
    });
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id },
    });
  }

  async findAll(skip = 0, take = 10): Promise<User[]> {
    return this.prisma.user.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }
}

