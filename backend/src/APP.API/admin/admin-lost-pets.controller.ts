import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../APP.Infrastructure/prisma/prisma.service';
import { AdminAccessGuard } from '../../common/guards/admin-access.guard';

@Controller('admin/lost-pets')
@UseGuards(AdminAccessGuard)
export class AdminLostPetsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listLost() {
    return this.prisma.pet.findMany({
      where: { isLost: true },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        breed: true,
        color: true,
        type: true,
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            homeAddress: true,
            district: true,
            city: true,
          },
        },
        updatedAt: true,
        createdAt: true,
      },
    });
  }
}

