import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ImageKit from 'imagekit';

@Injectable()
export class ImageKitService {
  private imageKit: ImageKit;

  constructor(private configService: ConfigService) {
    this.imageKit = new ImageKit({
      publicKey: this.configService.get<string>('IMAGEKIT_PUBLIC_KEY') || '',
      privateKey: this.configService.get<string>('IMAGEKIT_PRIVATE_KEY') || '',
      urlEndpoint: this.configService.get<string>('IMAGEKIT_URL_ENDPOINT') || '',
    });
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    folder: string,
    tags: string[],
    customMetadata?: Record<string, any>,
  ) {
    try {
      // Validate ImageKit configuration
      const publicKey = this.configService.get<string>('IMAGEKIT_PUBLIC_KEY');
      const privateKey = this.configService.get<string>('IMAGEKIT_PRIVATE_KEY');
      const urlEndpoint = this.configService.get<string>('IMAGEKIT_URL_ENDPOINT');
      
      if (!publicKey || !privateKey || !urlEndpoint) {
        throw new BadRequestException(
          'ImageKit configuration is incomplete. Please check IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT environment variables.'
        );
      }

      // Prepare upload options
      const uploadOptions: any = {
        file: fileBuffer.toString('base64'),
        fileName,
        folder,
        tags,
      };

      // Only include customMetadata if provided and convert all values to strings
      // ImageKit requires custom metadata fields to be defined in the dashboard first
      // If custom metadata is causing issues, it will be omitted
      if (customMetadata && Object.keys(customMetadata).length > 0) {
        // Convert all metadata values to strings as ImageKit expects string values
        const stringMetadata: Record<string, string> = {};
        for (const [key, value] of Object.entries(customMetadata)) {
          stringMetadata[key] = String(value ?? '');
        }
        uploadOptions.customMetadata = stringMetadata;
      }

      const upload = await this.imageKit.upload(uploadOptions);

      return {
        url: upload.url,
        fileId: upload.fileId,
        name: upload.name,
        size: upload.size,
        fileType: upload.fileType,
      };
    } catch (error: unknown) {
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Handle ImageKit SDK errors
        if ('message' in error) {
          errorMessage = String(error.message);
        } else if ('error' in error) {
          errorMessage = String(error.error);
        }
      }
      
      // Check for specific ImageKit error patterns
      if (errorMessage.includes('Invalid custom metadata') || errorMessage.includes('custom metadata')) {
        errorMessage = `ImageKit custom metadata error: ${errorMessage}. Note: Custom metadata fields must be defined in your ImageKit dashboard first. If you haven't set up custom metadata fields, the upload will work without them.`;
      } else if (errorMessage.includes('Invalid') || errorMessage.includes('authentication')) {
        errorMessage = `ImageKit authentication failed: ${errorMessage}. Please check your ImageKit credentials.`;
      } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        errorMessage = `ImageKit network error: ${errorMessage}. Please check your internet connection.`;
      }
      
      throw new BadRequestException(`ImageKit upload failed: ${errorMessage}`);
    }
  }

  async deleteFile(fileId: string) {
    try {
      await this.imageKit.deleteFile(fileId);
      return { success: true };
    } catch (error: unknown) {
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        if ('message' in error) {
          errorMessage = String(error.message);
        } else if ('error' in error) {
          errorMessage = String(error.error);
        }
      }
      
      throw new BadRequestException(`ImageKit delete failed: ${errorMessage}`);
    }
  }

  validateImageFile(file: Express.Multer.File): void {
    const maxSize = 6 * 1024 * 1024; // 6MB
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 6MB limit');
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
      );
    }
  }
}

