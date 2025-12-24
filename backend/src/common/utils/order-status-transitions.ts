/**
 * Order Status Transition Validation
 * 
 * Defines valid status transitions and provides validation utilities
 * to ensure orders follow logical state progression.
 */

export type OrderStatus =
  | 'PENDING'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'ORDER_PLACED'
  | 'PAYMENT_UNDER_REVIEW'
  | 'PAYMENT_VERIFIED'
  | 'ORDER_PACKED'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED';

/**
 * Valid status transitions map
 * Key: current status, Value: array of valid next statuses
 */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  // Initial state - can go to payment review, expire, fail, or cancel
  PENDING: [
    'PAYMENT_UNDER_REVIEW', // User submits payment
    'EXPIRED', // Timeout (cron job)
    'FAILED', // Payment attempt failed
    'CANCELLED', // User/admin cancels
  ],

  // Payment submitted - can be verified, failed, or cancelled
  PAYMENT_UNDER_REVIEW: [
    'PAYMENT_VERIFIED', // Admin verifies payment
    'FAILED', // Payment verification failed
    'CANCELLED', // Admin cancels
    'PENDING', // Revert to pending (if payment rejected)
  ],

  // Payment verified - can proceed to fulfillment or cancel
  PAYMENT_VERIFIED: [
    'ORDER_PACKED', // Start fulfillment
    'CANCELLED', // Cancel before packing
  ],

  // Fulfillment states - can progress forward or cancel
  ORDER_PACKED: [
    'SHIPPED', // Ship the order
    'CANCELLED', // Cancel before shipping
  ],

  SHIPPED: [
    'IN_TRANSIT', // Package in transit
    'DELIVERED', // Direct delivery (skip transit)
    'CANCELLED', // Cancel during shipping (rare)
  ],

  IN_TRANSIT: [
    'OUT_FOR_DELIVERY', // Out for delivery
    'DELIVERED', // Direct delivery (skip out for delivery)
  ],

  OUT_FOR_DELIVERY: [
    'DELIVERED', // Final delivery
  ],

  // Terminal states - cannot transition from these
  DELIVERED: [], // Terminal state
  EXPIRED: [], // Terminal state
  FAILED: [
    'PENDING', // Retry payment
    'CANCELLED', // Cancel after failure
  ],
  CANCELLED: [], // Terminal state

  // Legacy/alternative states
  ORDER_PLACED: [
    'PAYMENT_UNDER_REVIEW', // Same as PENDING
    'EXPIRED',
    'FAILED',
    'CANCELLED',
  ],
};

/**
 * Check if a status transition is valid
 * @param from Current status
 * @param to Target status
 * @returns true if transition is valid, false otherwise
 */
export function isValidStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
  // Same status is always valid (idempotent)
  if (from === to) return true;

  // Check if transition is in the allowed list
  const allowed = VALID_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

/**
 * Get all valid next statuses for a given current status
 * @param currentStatus Current order status
 * @returns Array of valid next statuses
 */
export function getValidNextStatuses(currentStatus: OrderStatus): OrderStatus[] {
  return VALID_TRANSITIONS[currentStatus] || [];
}

/**
 * Validate a status transition and throw if invalid
 * @param from Current status
 * @param to Target status
 * @throws Error if transition is invalid
 */
export function validateStatusTransition(from: OrderStatus, to: OrderStatus): void {
  if (!isValidStatusTransition(from, to)) {
    const validNext = getValidNextStatuses(from);
    throw new Error(
      `Invalid status transition from "${from}" to "${to}". ` +
      `Valid next statuses: ${validNext.length > 0 ? validNext.join(', ') : 'none (terminal state)'}`
    );
  }
}

/**
 * Check if a status is a terminal state (cannot transition from)
 * @param status Order status
 * @returns true if terminal, false otherwise
 */
export function isTerminalStatus(status: OrderStatus): boolean {
  return VALID_TRANSITIONS[status]?.length === 0;
}

/**
 * Check if an order can accept payment
 * @param status Current order status
 * @returns true if payment can be accepted, false otherwise
 */
export function canAcceptPayment(status: OrderStatus): boolean {
  return status === 'PENDING' || status === 'FAILED';
}

/**
 * Check if an order can be expired (by cron job)
 * @param status Current order status
 * @returns true if can be expired, false otherwise
 */
export function canExpire(status: OrderStatus): boolean {
  return status === 'PENDING';
}

