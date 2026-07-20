import { normalizeWhatsApp } from "./coupon";

/** Build a WhatsApp click-to-chat link with a pre-filled message. */
export function waLink(number: string, text: string): string {
  const digits = normalizeWhatsApp(number);
  const base = digits ? `https://wa.me/${digits}` : `https://api.whatsapp.com/send`;
  return `${base}?text=${encodeURIComponent(text)}`;
}

/** Message Salkara staff send to the customer with their new coupon. */
export function customerCouponMessage(
  name: string,
  code: string,
  link: string,
  validUntil: string
): string {
  const hi = name ? `Hello ${name}! ` : "Hello! ";
  return (
    `${hi}🎉\n\n` +
    `Here is your *Salkara x CISO Marine World* Joint Holiday Discount Coupon.\n\n` +
    `🎟️ Coupon code: *${code}*\n` +
    `🐠 Show it at CISO Marine World for *10% OFF entry tickets*.\n` +
    `🍽️ After your visit, get *10% OFF your food bill* at Salkara.\n` +
    `📅 Valid until: ${validUntil}\n\n` +
    `Open your coupon here:\n${link}\n\n` +
    `Taste the Best, Discover the Ocean 🌊`
  );
}

/** Generic "share this coupon" message (used on the coupon page). */
export function shareCouponMessage(code: string, link: string): string {
  return (
    `My Salkara x CISO Marine World discount coupon 🎟️\n` +
    `Code: ${code}\n${link}`
  );
}

/** Message a customer might send Marine World to ask about their coupon. */
export function contactMarineMessage(code?: string): string {
  return code
    ? `Hi CISO Marine World! I have a Salkara joint coupon (${code}) and would like 10% off entry tickets.`
    : `Hi CISO Marine World! I have a Salkara joint discount coupon and would like 10% off entry tickets.`;
}

/** Message a customer might send Salkara to ask about their coupon. */
export function contactSalkaraMessage(code?: string): string {
  return code
    ? `Hi Salkara! I used my joint coupon (${code}) at CISO Marine World and would like my 10% food discount.`
    : `Hi Salkara! I would like a Salkara x CISO Marine World joint discount coupon.`;
}

/** Message Salkara staff can send to confirm the food discount was applied. */
export function completedMessage(name: string, code: string): string {
  const hi = name ? `Hi ${name}! ` : "Hi! ";
  return (
    `${hi}✅ Your 10% Salkara food discount (coupon ${code}) has been applied. ` +
    `Thank you for visiting Salkara & CISO Marine World!`
  );
}
