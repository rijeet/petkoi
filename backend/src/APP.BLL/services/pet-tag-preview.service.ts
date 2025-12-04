import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCanvas, loadImage, CanvasRenderingContext2D as NodeCanvasRenderingContext2D } from 'canvas';
import * as QRCode from 'qrcode';
import { ImageKitService } from '../../APP.Infrastructure/imagekit/imagekit.service';
import { TagColor } from '../../APP.Shared/dtos/pet-tag.dto';

@Injectable()
export class PetTagPreviewService {
  constructor(
    private imageKitService: ImageKitService,
    private configService: ConfigService,
  ) {}

  /**
   * Draw text along a circular arc
   */
  private drawArcText(
    ctx: NodeCanvasRenderingContext2D,
    text: string,
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    fontSize: number,
  ): void {
    ctx.save();
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    // Calculate total arc span (for top: 180 degrees, for bottom: 180 degrees)
    const arcSpan = Math.PI; // 180 degrees
    const chars = text.split('');
    const charSpacing = arcSpan / (chars.length + 1); // Distribute characters evenly

    chars.forEach((char, index) => {
      // Calculate angle for this character
      const angle = startAngle + (index + 1) * charSpacing;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      ctx.save();
      ctx.translate(x, y);
      // Rotate to follow the arc (perpendicular to radius)
      ctx.rotate(angle + Math.PI / 2);
      ctx.fillText(char, 0, 0);
      ctx.restore();
    });

    ctx.restore();
  }

  /**
   * Generate front side of pet tag (with QR code)
   */
  async generateTagFront(
    qrCodeUrl: string,
    tagColor: TagColor,
  ): Promise<Buffer> {
    // 32mm tag size at 300 DPI = ~378 pixels
    const tagSizeMm = 32;
    const dpi = 300;
    const pixelsPerMm = dpi / 25.4;
    const canvasSize = Math.round(tagSizeMm * pixelsPerMm); // ~378px
    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    const radius = canvasSize / 2 - 10; // Leave 10px margin for border

    // Create canvas
    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');

    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Draw circular tag with colored border (based on tagColor)
    const borderColor = this.getColorHex(tagColor);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 8; // 8px border
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Fill white circle inside
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 4, 0, Math.PI * 2);
    ctx.fill();

    // Generate QR code
    const qrCodeBuffer = await QRCode.toBuffer(qrCodeUrl, {
      width: Math.round(radius * 0.8), // QR code takes 80% of radius
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Load and draw QR code
    const qrImage = await loadImage(qrCodeBuffer);
    const qrSize = Math.min(qrImage.width, qrImage.height);
    const qrX = centerX - qrSize / 2;
    const qrY = centerY - qrSize / 2;
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

    // Draw top arc text: "SCAN TO FIND MY FAMILY"
    // Position at top arc (curving along the top half, from right to left)
    const topText = 'SCAN TO FIND MY FAMILY';
    const topTextRadius = radius * 0.75; // Position text at 75% of radius
    const topStartAngle = 0; // Start from right (0 degrees), curve to left (PI)
    const topFontSize = Math.round(radius * 0.08);
    this.drawArcText(ctx, topText, centerX, centerY, topTextRadius, topStartAngle, topFontSize);

    // Draw bottom arc text: "PETKOI.COM"
    // Position at bottom arc (curving along the bottom half, from left to right)
    const bottomText = 'PETKOI.COM';
    const bottomTextRadius = radius * 0.75;
    const bottomStartAngle = Math.PI; // Start from left (PI), curve to right (2*PI or 0)
    const bottomFontSize = Math.round(radius * 0.07);
    this.drawArcText(ctx, bottomText, centerX, centerY, bottomTextRadius, bottomStartAngle, bottomFontSize);

    return canvas.toBuffer('image/png');
  }

  /**
   * Generate back side of pet tag (with paw print)
   */
  async generateTagBack(tagColor: TagColor): Promise<Buffer> {
    // 32mm tag size at 300 DPI = ~378 pixels
    const tagSizeMm = 32;
    const dpi = 300;
    const pixelsPerMm = dpi / 25.4;
    const canvasSize = Math.round(tagSizeMm * pixelsPerMm);
    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    const radius = canvasSize / 2 - 10;

    // Create canvas
    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');

    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Draw circular tag with colored border
    const borderColor = this.getColorHex(tagColor);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Fill white circle inside
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw thin black circular outline inside
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 6, 0, Math.PI * 2);
    ctx.stroke();

    // Draw paw print in center
    const pawSize = radius * 0.4;
    this.drawPawIcon(ctx, centerX, centerY, pawSize);

    return canvas.toBuffer('image/png');
  }

  /**
   * Generate a pet tag preview image (front side)
   * @param qrCodeUrl - The QR code URL to embed
   * @param tagColor - The color of the tag border
   * @param petName - Optional pet name for display
   * @returns Buffer of the generated tag image
   */
  async generateTagPreview(
    qrCodeUrl: string,
    tagColor: TagColor,
    petName?: string,
  ): Promise<Buffer> {
    // Generate front side (with QR code)
    return this.generateTagFront(qrCodeUrl, tagColor);
  }

  /**
   * Generate tag preview (front side) and upload to ImageKit
   */
  async generateAndUploadPreview(
    qrCodeUrl: string,
    tagColor: TagColor,
    petId: string,
    orderId: string,
    petName?: string,
  ): Promise<string> {
    const buffer = await this.generateTagPreview(qrCodeUrl, tagColor, petName);
    const fileName = `pet-tag-front-${orderId}-${Date.now()}.png`;

    const uploadResult = await this.imageKitService.uploadFile(
      buffer,
      fileName,
      `pet-tags/${petId}`,
      ['pet-tag', 'preview', 'front', petId, orderId],
      {
        petId,
        orderId,
        tagColor,
        side: 'front',
      },
    );

    return uploadResult.url;
  }

  /**
   * Generate tag back side and upload to ImageKit
   */
  async generateAndUploadBackSide(
    tagColor: TagColor,
    petId: string,
    orderId: string,
  ): Promise<string> {
    const buffer = await this.generateTagBack(tagColor);
    const fileName = `pet-tag-back-${orderId}-${Date.now()}.png`;

    const uploadResult = await this.imageKitService.uploadFile(
      buffer,
      fileName,
      `pet-tags/${petId}`,
      ['pet-tag', 'preview', 'back', petId, orderId],
      {
        petId,
        orderId,
        tagColor,
        side: 'back',
      },
    );

    return uploadResult.url;
  }

  /**
   * Get hex color for tag color enum
   */
  private getColorHex(color: TagColor): string {
    const colorMap: Record<TagColor, string> = {
      [TagColor.GREEN]: '#4CAF50',
      [TagColor.PINK]: '#E91E63',
      [TagColor.BLUE]: '#2196F3',
      [TagColor.BLACK]: '#212121',
    };
    return colorMap[color] || '#212121';
  }

  /**
   * Draw a paw print icon (centered)
   */
  private drawPawIcon(ctx: NodeCanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.fillStyle = '#000000';
    
    // Main pad (larger circle at bottom center)
    ctx.beginPath();
    ctx.arc(x, y + size * 0.2, size * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Top left toe
    ctx.beginPath();
    ctx.arc(x - size * 0.25, y - size * 0.15, size * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Top right toe
    ctx.beginPath();
    ctx.arc(x + size * 0.25, y - size * 0.15, size * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Bottom left toe
    ctx.beginPath();
    ctx.arc(x - size * 0.2, y + size * 0.1, size * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Bottom right toe
    ctx.beginPath();
    ctx.arc(x + size * 0.2, y + size * 0.1, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }
}
