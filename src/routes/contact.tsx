import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { STORE, whatsappLink } from "@/lib/format";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Tikar Books Emporium — Buldhana Book Store" },
      {
        name: "description",
        content:
          "Call, WhatsApp, email or visit Tikar Books Emporium in Buldhana, Maharashtra. Store hours, location map and enquiry form.",
      },
      { property: "og:title", content: "Contact Tikar Books Emporium, Buldhana" },
      {
        property: "og:description",
        content: "Phone, WhatsApp, email, opening hours and directions to our Buldhana bookstore.",
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      toast.error("Please add your name and your message.");
      return;
    }
    window.open(
      whatsappLink(
        `Hello ${STORE.name},\nName: ${form.name}\nPhone: ${form.phone}\n\n${form.message}`,
      ),
      "_blank",
    );
    toast.success("Opening WhatsApp with your enquiry.");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-display text-4xl">Contact us</h1>
      <p className="mt-2 text-muted-foreground">
        We reply fastest on WhatsApp during store hours.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="surface-card p-6">
            <h2 className="text-display text-xl">{STORE.name}</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex gap-3">
                <MapPin className="size-4 shrink-0 text-primary" aria-hidden /> {STORE.address}
              </li>
              <li className="flex gap-3">
                <Phone className="size-4 shrink-0 text-primary" aria-hidden />
                <a href={`tel:${STORE.phone.replace(/\s/g, "")}`} className="hover:text-primary">
                  {STORE.phone}
                </a>
              </li>
              <li className="flex gap-3">
                <MessageCircle className="size-4 shrink-0 text-primary" aria-hidden />
                <a
                  href={whatsappLink("Hello Tikar Books Emporium!")}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary"
                >
                  WhatsApp us
                </a>
              </li>
              <li className="flex gap-3">
                <Mail className="size-4 shrink-0 text-primary" aria-hidden />
                <a href={`mailto:${STORE.email}`} className="hover:text-primary">
                  {STORE.email}
                </a>
              </li>
              {STORE.hours.map((h) => (
                <li key={h.days} className="flex gap-3">
                  <Clock className="size-4 shrink-0 text-primary" aria-hidden /> {h.days}: {h.time}
                </li>
              ))}
            </ul>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <iframe
              title="Map to Tikar Books Emporium, Buldhana"
              src="https://www.google.com/maps?q=${encodeURIComponent(STORE.address)}&output=embed"
              className="h-72 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        <form onSubmit={submit} className="surface-card space-y-4 p-6">
          <h2 className="text-display text-xl">Send an enquiry</h2>
          <div className="space-y-2">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Mobile number</Label>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Which book are you looking for?</Label>
            <Textarea
              id="message"
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            <MessageCircle className="size-4" /> Send on WhatsApp
          </Button>
          <p className="text-xs text-muted-foreground">
            Your message opens in WhatsApp so you keep a copy of the conversation.
          </p>
        </form>
      </div>
    </div>
  );
}
