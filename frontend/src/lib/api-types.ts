export type CreateOrderRequest = {
  items: { productId: string; quantity: number }[];
  shippingAddress?: string;
  shippingDistrict?: string;
  shippingPostalCode?: string;
  contactPhone?: string;
  contactName?: string;
  petId?: string;
  petQrUrl?: string;
  // orderNo ignored by backend; do not send it
};

export type OrderSummary = {
  orderNo: string;
  status: string;
  totalBDT: number;
  shippingFeeBDT: number;
};

export type Order = OrderSummary & {
  subtotalBDT: number;
  weightGrams: number;
  shippingZoneId?: string | null;
  shippingAddress?: string;
  shippingDistrict?: string | null;
  shippingPostalCode?: string | null;
  contactPhone?: string | null;
  contactName?: string | null;
  expiresAt?: string | null;
  petId?: string | null;
  petQrUrl?: string | null;
  pet?: {
    id: string;
    name?: string | null;
    qrCodeUrl?: string | null;
  } | null;
  items?: Array<{
    productId: string;
    name: string;
    sku: string;
    unitPriceBDT: number;
    quantity: number;
    totalBDT: number;
  }>;
};

export type CreateOrderResponse = {
  orderNo: string;
  status: string;
  totalBDT: number;
  shippingFeeBDT: number;
  order?: Order;
  shipping?: any;
};

export type ManualPaymentRequest = {
  orderNo: string;
  method: 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK' | 'PAYPAL' | 'OTHER';
  amountBDT: number;
  trxId: string;
  agentAccount?: string;
  contactNumber?: string;
  note?: string;
};

export type ManualPaymentResponse = {
  orderNo: string;
  manualPaymentId: string;
  status: string;
};


