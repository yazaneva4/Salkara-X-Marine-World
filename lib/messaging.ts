import { normalizeWhatsApp } from "./coupon";
import { waLink } from "./whatsapp";

/** Apps a message can be sent through. All of them use plain links, no APIs. */
export type Channel = "whatsapp" | "apple-messages" | "google-messages" | "google-chat";

export const CHANNELS: { id: Channel; label: string; hint: string }[] = [
  { id: "whatsapp", label: "WhatsApp", hint: "Uses the customer's number" },
  { id: "apple-messages", label: "Apple Messages", hint: "iPhone / Mac, uses the customer's number" },
  { id: "google-messages", label: "Google Messages", hint: "Android, uses the customer's number" },
  { id: "google-chat", label: "Google Chat", hint: "Needs the customer's email address" },
];

/** SMS apps do not render WhatsApp-style *bold*, so drop the asterisks. */
export function plainText(text: string): string {
  return text.replace(/\*(\S(?:[^*]*\S)?)\*/g, "$1");
}

/**
 * An sms: link with a pre-filled body. The phone's default messages app handles
 * it (Apple Messages on iPhone and Mac, Google Messages on most Android phones).
 * "?&body=" is the form that works on both iOS and Android.
 */
export function smsLink(number: string, text: string): string {
  const digits = normalizeWhatsApp(number);
  return `sms:${digits ? "+" + digits : ""}?&body=${encodeURIComponent(plainText(text))}`;
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Opens a direct Google Chat conversation. Chat links cannot pre-fill text, so
 * the caller copies the message to the clipboard first.
 */
export function googleChatLink(email: string): string {
  return `https://mail.google.com/chat/u/0/#chat/dm/${encodeURIComponent(email.trim())}`;
}

/** Link for every channel except Google Chat (which needs an email, see above). */
export function messageLink(channel: Exclude<Channel, "google-chat">, number: string, text: string): string {
  return channel === "whatsapp" ? waLink(number, text) : smsLink(number, text);
}
