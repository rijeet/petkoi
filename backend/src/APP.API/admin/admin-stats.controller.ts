import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../APP.Infrastructure/prisma/prisma.service';
import { AdminAccessGuard } from '../../common/guards/admin-access.guard';

@Controller('admin/stats')
@UseGuards(AdminAccessGuard)
export class AdminStatsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async summary() {
    const [users, pets, orders, lostPets] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.pet.count(),
      this.prisma.order.count(),
      this.prisma.pet.count({ where: { isLost: true } }),
    ]);
    return { users, pets, orders, lostPets };
  }
}

