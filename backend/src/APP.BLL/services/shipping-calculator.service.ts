import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../APP.Infrastructure/prisma/prisma.service';
import { DomainException } from '@APP.Shared/exceptions/domain.exception';

export type ShippingInputItem = {
  weightGrams: number;
  volumetricWeightGrams?: number | null;
  quantity: number;
  categoryExtraBDT?: number;
  longestSideCm?: number | null;
};

export type ShippingCalculationParams = {
  items: ShippingInputItem[];
  subtotalBDT: number;
  postalCode?: string;
  district?: string;
};

@Injectable()
export class ShippingCalculatorService {
  constructor(private readonly prisma: PrismaService) {}

  private extractBillableWeight(items: ShippingInputItem[]) {
    let weightGrams = 0;
    for (const item of items) {
      const base = item.weightGrams ?? 0;
      const vol = item.volumetricWeightGrams ?? 0;
      const billable = Math.max(base, vol);
      weightGrams += billable * (item.quantity || 1);
    }
    return weightGrams;
  }

  private async resolveZone(postalCode?: string, district?: string) {
    // Try postal prefix match (longest prefix wins)
    if (postalCode) {
      const prefixes = await this.prisma.shippingZonePostalPrefix.findMany({
        include: { zone: true },
      });
      let best: { zone: any; len: number } | null = null;
      for (const p of prefixes) {
        if (postalCode.startsWith(p.prefix)) {
          if (!best || p.prefix.length > best.len) {
            best = { zone: p.zone, len: p.prefix.length };
          }
        }
      }
      if (best) return best.zone;
    }

    // Fallback to district name
    if (district) {
      const match = await this.prisma.shippingZoneDistrict.findFirst({
        where: { district: { equals: district, mode: 'insensitive' } },
        include: { zone: true },
      });
      if (match) return match.zone;
    }

    // Fallback to any zone (e.g., remote)
    const fallback = await this.prisma.shippingZone.findFirst({
      orderBy: { baseFeeBDT: 'asc' },
    });
    if (!fallback) {
      throw new DomainException('Shipping zones not configured');
    }
    return fallback;
  }

  async calculate(params: ShippingCalculationParams) {
    const { items, subtotalBDT, postalCode, district } = params;
    if (!items.length) {
      throw new DomainException('No items to ship');
    }

    const zone = await this.resolveZone(postalCode, district);
    const weightGrams = this.extractBillableWeight(items);
    const weightKg = Math.ceil((weightGrams || 0) / 1000);

    let shippingFee = zone.baseFeeBDT + zone.perKgFeeBDT * Math.max(weightKg, 1);

    // Free threshold if configured
    if (zone.freeThresholdBDT && subtotalBDT >= zone.freeThresholdBDT) {
      shippingFee = 0;
    }

    const categoryExtra = items.reduce((acc, item) => acc + (item.categoryExtraBDT || 0) * (item.quantity || 1), 0);
    const totalShipping = shippingFee + categoryExtra;

    return {
      zone,
      weightGrams,
      weightKg,
      shippingFeeBDT: shippingFee,
      categoryExtraBDT: categoryExtra,
      totalShippingBDT: totalShipping,
    };
  }
}


