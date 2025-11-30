/**
 * Utility function to download QR code as PNG
 */
export async function downloadQRCodeAsPNG(
  qrValue: string,
  filename: string = 'qr-code.png',
  size: number = 512
): Promise<void> {
  try {
    const QRCode = await import('qrcode');
    const canvas = document.createElement('canvas');
    
    await QRCode.default.toCanvas(canvas, qrValue, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'));
          return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        resolve();
      }, 'image/png');
    });
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

