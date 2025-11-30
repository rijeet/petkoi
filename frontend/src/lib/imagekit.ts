/**
 * ImageKit URL transformation utilities
 * Adds transformations to ImageKit URLs for consistent image sizing
 */

export interface ImageKitTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  aspectRatio?: 'square' | 'landscape' | 'portrait';
  crop?: 'maintain_ratio' | 'force' | 'at_least' | 'at_max';
}

/**
 * Adds ImageKit transformations to a URL
 * @param url - The original ImageKit URL
 * @param options - Transformation options
 * @returns The transformed URL
 */
export function transformImageKitUrl(
  url: string,
  options: ImageKitTransformOptions = {}
): string {
  if (!url || !url.includes('imagekit.io')) {
    return url; // Return original URL if not an ImageKit URL
  }

  const {
    width,
    height,
    quality = 80,
    format = 'auto',
    aspectRatio,
    crop = 'maintain_ratio',
  } = options;

  // Parse the URL
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;

  // Build transformation string
  const transformations: string[] = [];

  // Set aspect ratio-based dimensions
  if (aspectRatio) {
    switch (aspectRatio) {
      case 'square':
        if (width && height) {
          // Use both width and height for square
          transformations.push(`w-${width}`, `h-${height}`);
        } else if (width) {
          transformations.push(`w-${width}`, `h-${width}`);
        } else if (height) {
          transformations.push(`w-${height}`, `h-${height}`);
        } else {
          transformations.push('w-400', 'h-400');
        }
        break;
      case 'landscape':
        if (width) {
          transformations.push(`w-${width}`, `h-${Math.round(width * 0.5625)}`); // 16:9
        } else if (height) {
          transformations.push(`w-${Math.round(height * 1.777)}`, `h-${height}`);
        } else {
          transformations.push('w-800', 'h-450');
        }
        break;
      case 'portrait':
        if (width) {
          transformations.push(`w-${width}`, `h-${Math.round(width * 1.333)}`); // 3:4
        } else if (height) {
          transformations.push(`w-${Math.round(height * 0.75)}`, `h-${height}`);
        } else {
          transformations.push('w-400', 'h-533');
        }
        break;
    }
  } else {
    if (width) transformations.push(`w-${width}`);
    if (height) transformations.push(`h-${height}`);
  }

  // Add quality
  transformations.push(`q-${quality}`);

  // Add format
  if (format !== 'auto') {
    transformations.push(`f-${format}`);
  }

  // Add crop mode - at_max fits image within dimensions without cropping
  // at_least ensures minimum dimensions
  // force forces exact dimensions (may crop)
  if (crop && crop !== 'maintain_ratio') {
    transformations.push(`c-${crop}`);
  } else if (crop === 'maintain_ratio') {
    // maintain_ratio is default, no transformation needed
  } else {
    // Default to at_max to fit full image
    transformations.push('c-at_max');
  }

  // Build the transformation string
  const transformString = transformations.join(',');

  // Insert transformation into URL
  // ImageKit format: https://ik.imagekit.io/.../path?tr=w-400,h-400,q-80
  if (transformString) {
    urlObj.searchParams.set('tr', transformString);
  }

  return urlObj.toString();
}

/**
 * Predefined transformations for common use cases
 */
export const imageTransforms = {
  thumbnail: (url: string) => transformImageKitUrl(url, { width: 200, height: 200, aspectRatio: 'square' }),
  small: (url: string) => transformImageKitUrl(url, { width: 400, aspectRatio: 'landscape' }),
  medium: (url: string) => transformImageKitUrl(url, { width: 800, aspectRatio: 'landscape' }),
  large: (url: string) => transformImageKitUrl(url, { width: 1200, aspectRatio: 'landscape' }),
  square: (url: string, size = 400) => transformImageKitUrl(url, { width: size, height: size, aspectRatio: 'square' }),
  landscape: (url: string, width = 800) => transformImageKitUrl(url, { width, aspectRatio: 'landscape' }),
  portrait: (url: string, height = 600) => transformImageKitUrl(url, { height, aspectRatio: 'portrait' }),
};

