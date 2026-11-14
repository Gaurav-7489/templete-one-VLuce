import { dealership } from "@/config/dealership";

export const whatsappLink = (text?: string) =>
  `https://wa.me/${dealership.contact.whatsappE164}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export const telLink = () => `tel:+${dealership.contact.phoneE164}`;
