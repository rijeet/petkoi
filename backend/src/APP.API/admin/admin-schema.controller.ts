import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../APP.Infrastructure/prisma/prisma.service';
import { AdminAccessGuard } from '../../common/guards/admin-access.guard';

@Controller('admin/schema')
@UseGuards(AdminAccessGuard)
export class AdminSchemaController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('tables')
  async listTables() {
    const rows = await this.prisma.$queryRaw<
      Array<{ schema: string; name: string; type: string }>
    >`SELECT table_schema AS "schema", table_name AS "name", table_type AS "type"
       FROM information_schema.tables
       WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
       ORDER BY table_schema, table_name`;
    return rows;
  }
}

