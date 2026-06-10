import type { CartLine } from "@/pos/types";

export function cartSubtotalCents(cart: CartLine[]): number {
  return cart.reduce((sum, line) => sum + line.unitCents * line.quantity, 0);
}

export function cartItemCount(cart: CartLine[]): number {
  return cart.reduce((sum, line) => sum + line.quantity, 0);
}

export function addToCart(
  cart: CartLine[],
  type: "service" | "product",
  id: number,
  name: string,
  unitCents: number,
  maxQty?: number
): { cart: CartLine[]; error?: string } {
  if (type === "product" && maxQty !== undefined && maxQty <= 0) {
    return { cart, error: "Out of stock at this branch" };
  }

  const key = `${type}-${id}`;
  const existing = cart.find((l) => l.key === key);

  if (existing) {
    const nextQty = existing.quantity + 1;
    if (existing.maxQty !== undefined && nextQty > existing.maxQty) {
      return { cart, error: `Only ${existing.maxQty} in stock` };
    }
    return {
      cart: cart.map((l) => (l.key === key ? { ...l, quantity: nextQty } : l)),
    };
  }

  return {
    cart: [...cart, { key, type, id, name, unitCents, quantity: 1, maxQty }],
  };
}

export function updateCartQty(
  cart: CartLine[],
  key: string,
  delta: number
): { cart: CartLine[]; error?: string } {
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

export function removeCartLine(cart: CartLine[], key: string): CartLine[] {
  return cart.filter((l) => l.key !== key);
}
