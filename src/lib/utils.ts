export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function generateInvoiceNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${timestamp}-${random}`;
}

export function calculateItemAmount(
  unitPrice: number,
  quantity: number,
  discountPercent: number
): number {
  const gross = unitPrice * quantity;
  return gross - (gross * discountPercent) / 100;
}

export function calculateTax(amount: number, taxPercent: number): number {
  return (amount * taxPercent) / 100;
}

export function calculateInvoiceTotals(
  items: { unitPrice: number; quantity: number; discount: number; taxPercent: number }[]
) {
  let subtotal = 0;
  let taxAmount = 0;
  let discountTotal = 0;

  for (const item of items) {
    const gross = item.unitPrice * item.quantity;
    const itemDiscount = (gross * item.discount) / 100;
    const afterDiscount = gross - itemDiscount;
    const itemTax = (afterDiscount * item.taxPercent) / 100;

    discountTotal += itemDiscount;
    taxAmount += itemTax;
    subtotal += afterDiscount;
  }

  return {
    subtotal,
    discount: discountTotal,
    taxAmount,
    totalAmount: subtotal + taxAmount,
  };
}

export function durationLabel(d: string): string {
  const map: Record<string, string> = {
    ONE_TIME: "One Time",
    THREE_MONTHS: "3 Months",
    SIX_MONTHS: "6 Months",
    TWELVE_MONTHS: "12 Months",
  };
  return map[d] || d;
}
