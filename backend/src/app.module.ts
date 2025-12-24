import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './APP.Infrastructure/prisma/prisma.module';
import { AuthModule } from './APP.API/auth/auth.module';
import { UsersModule } from './APP.API/users/users.module';
import { PetsModule } from './APP.API/pets/pets.module';
import { PetImagesModule } from './APP.API/pet-images/pet-images.module';
import { GPSModule } from './APP.API/gps/gps.module';
import { NotificationsModule } from './APP.API/notifications/notifications.module';
import { CommunityModule } from './APP.API/community/community.module';
import { DirectoryModule } from './APP.API/directory/directory.module';
import { HealthModule } from './APP.API/health/health.module';
import { PetTagsModule } from './APP.API/pet-tags/pet-tags.module';
import { AdminAuthModule } from './APP.API/admin-auth/admin-auth.module';
import { OrdersModule } from './APP.API/orders/orders.module';
import { PaymentsModule } from './APP.API/payments/payments.module';
import { AdminModule } from './APP.API/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    AdminAuthModule,
    UsersModule,
    PetsModule,
    PetImagesModule,
    GPSModule,
    NotificationsModule,
    CommunityModule,
    DirectoryModule,
    HealthModule,
    PetTagsModule,
    OrdersModule,
    PaymentsModule,
    AdminModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

