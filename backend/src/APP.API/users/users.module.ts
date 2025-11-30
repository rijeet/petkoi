import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserService } from '../../APP.BLL/services/user.service';
import { PrismaModule } from '../../APP.Infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UserService],
  exports: [UserService],
})
export class UsersModule {}

