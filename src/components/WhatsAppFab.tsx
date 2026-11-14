import { dealership } from "@/config/dealership";
import { whatsappLink } from "@/lib/whatsapp";
import { WhatsApp } from "./icons";

export function WhatsAppFab() {
  return (
    <a className="wa-fab" href={whatsappLink(`Hello ${dealership.name}, I'd like to know more about your collection.`)} target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp">
      <WhatsApp />
    </a>
  );
}
