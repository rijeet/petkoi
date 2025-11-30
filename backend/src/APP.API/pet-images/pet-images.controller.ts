import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PetImageService } from '../../APP.BLL/services/pet-image.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('pets/:petId/images')
@UseGuards(JwtAuthGuard)
export class PetImagesController {
  constructor(private petImageService: PetImageService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @Param('petId') petId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { sub: string },
  ) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    return this.petImageService.uploadImage(petId, file, user.sub, user.sub);
  }

  @Get()
  @Public()
  async getPetImages(@Param('petId') petId: string) {
    return this.petImageService.getPetImages(petId);
  }

  @Post('found')
  @Public()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('image'))
  async uploadFoundPetImage(
    @Param('petId') petId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    // Upload image to ImageKit and return URL
    // This is a public endpoint for reporting found pets
    return this.petImageService.uploadFoundPetImage(petId, file);
  }

  @Delete(':imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteImage(
    @Param('petId') petId: string,
    @Param('imageId') imageId: string,
    @CurrentUser() user: { sub: string },
  ) {
    await this.petImageService.deleteImage(imageId, user.sub);
  }
}

