import { dealership } from "@/config/dealership";
import { whatsappLink } from "@/lib/whatsapp";

export const directionsUrl = () => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dealership.showroom.mapQuery)}`;
export const mapEmbedUrl = () => `https://www.google.com/maps?q=${encodeURIComponent(dealership.showroom.mapQuery)}&output=embed`;

export function ShowroomInfo() {
  const s = dealership.showroom;
  return (
    <div className="info-grid">
      <div>
        <h3>Address</h3>
        <p>
          {s.addressLines.map((l) => (
            <span key={l}>{l}<br /></span>
          ))}
          {s.city} {s.postalCode}, {s.region}
        </p>
      </div>
      <div>
        <h3>Hours</h3>
        <p>
          {s.hours.map((h) => (
            <span key={h.days}>{h.days}<br /><span className="muted">{h.time}</span><br /></span>
          ))}
        </p>
      </div>
      <div>
        <h3>Call</h3>
        <p><a href={`tel:+${dealership.contact.phoneE164}`}>{dealership.contact.phone}</a></p>
      </div>
      <div>
        <h3>Write</h3>
        <p>
          <a href={`mailto:${dealership.contact.email}`}>{dealership.contact.email}</a>
          <br />
          <a href={whatsappLink()} target="_blank" rel="noopener">WhatsApp concierge</a>
        </p>
      </div>
    </div>
  );
}
