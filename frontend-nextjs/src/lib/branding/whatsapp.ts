/** Normalize a phone/WhatsApp value into a wa.me chat URL. */
export function buildWhatsAppChatUrl(
  number: string | null | undefined,
  message?: string | null
): string | null {
  if (!number?.trim()) return null;
  const digits = number.replace(/\D/g, "");
  if (!digits) return null;

  const base = `https://wa.me/${digits}`;
  const text = message?.trim();
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function defaultBookingWhatsAppMessage(tenantName: string) {
  return `Hi! I'd like to book an appointment at ${tenantName}.`;
}
