import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';

@Injectable()
export class QRService {
  constructor(private configService: ConfigService) {}

  async generateQRCode(petId: string): Promise<string> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const qrUrl = `${frontendUrl}/pet/${petId}/public`;

    try {
      // Generate QR code as data URL (SVG)
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        type: 'image/png',
        width: 300,
        margin: 2,
      });

      return qrDataUrl;
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateQRCodeBuffer(petId: string): Promise<Buffer> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const qrUrl = `${frontendUrl}/pet/${petId}/public`;

    try {
      // Generate QR code as Buffer
      const qrBuffer = await QRCode.toBuffer(qrUrl, {
        type: 'png',
        width: 300,
        margin: 2,
      });

      return qrBuffer;
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getQRUrl(petId: string): string {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    return `${frontendUrl}/pet/${petId}/public`;
  }
}

