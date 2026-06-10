import type { PosCartLine } from "./pos-types";

export function cartSubtotalCents(cart: PosCartLine[]): number {
  return cart.reduce((sum, line) => sum + line.unitCents * line.quantity, 0);
}

export function cartToApiItems(cart: PosCartLine[]) {
  return cart.map((line) => ({
    type: line.type,
    service_id: line.type === "service" ? line.id : undefined,
    product_id: line.type === "product" ? line.id : undefined,
    service_addon_id: line.type === "addon" ? line.id : undefined,
    quantity: line.quantity,
  }));
}

export function addProductToCart(
  cart: PosCartLine[],
  id: number,
  name: string,
  unitCents: number,
  maxQty?: number
): { cart: PosCartLine[]; error?: string } {
  if (maxQty !== undefined && maxQty <= 0) {
    return { cart, error: "Out of stock at this branch" };
  }

  const key = `product-${id}`;
  const existing = cart.find((l) => l.key === key);
  if (existing) {
    const nextQty = existing.quantity + 1;
    if (existing.maxQty !== undefined && nextQty > existing.maxQty) {
      return { cart, error: `Only ${existing.maxQty} in stock` };
    }
    return { cart: cart.map((l) => (l.key === key ? { ...l, quantity: nextQty } : l)) };
  }

  return {
    cart: [...cart, { key, type: "product", id, name, unitCents, quantity: 1, maxQty }],
  };
}

export function addServiceToCart(
  cart: PosCartLine[],
  id: number,
  name: string,
  unitCents: number
): PosCartLine[] {
  const key = `service-${id}`;
  const existing = cart.find((l) => l.key === key);
  if (existing) {
    return cart.map((l) => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l));
  }
  return [...cart, { key, type: "service", id, name, unitCents, quantity: 1 }];
}

export function addAddonToCart(
  cart: PosCartLine[],
  addonId: number,
  serviceId: number,
  serviceName: string,
  addonName: string,
  unitCents: number
): PosCartLine[] {
  const key = `addon-${addonId}`;
  const label = `${serviceName} · ${addonName}`;
  const existing = cart.find((l) => l.key === key);
  if (existing) {
    return cart.map((l) => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l));
  }
  return [
    ...cart,
    { key, type: "addon", id: addonId, serviceId, name: label, unitCents, quantity: 1 },
  ];
}

export function updateCartQty(
  cart: PosCartLine[],
  key: string,
  delta: number
): { cart: PosCartLine[]; error?: string } {
  const line = cart.find((l) => l.key === key);
  if (!line) return { cart };

  const next = line.quantity + delta;
  if (next <= 0) {
    return { cart: cart.filter((l) => l.key !== key) };
  }
  if (line.maxQty !== undefined && next > line.maxQty) {
    return { cart, error: `Only ${line.maxQty} in stock` };
  }
  return { cart: cart.map((l) => (l.key === key ? { ...l, quantity: next } : l)) };
}
