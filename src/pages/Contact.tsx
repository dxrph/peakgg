import { useState } from "react";
import { z } from "zod";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, MessageSquare, Clock, MapPin, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useI18n } from "@/i18n";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  subject: z.enum(["general", "bug", "partnership", "press", "ban_appeal", "legal", "other"]),
  message: z.string().trim().min(1, "Message is required").max(1000),
});

export default function ContactPage() {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<string>("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const SUBJECTS = [
    { value: "general", label: t("contact.subj_general") },
    { value: "bug", label: t("contact.subj_bug") },
    { value: "partnership", label: t("contact.subj_partnership") },
    { value: "press", label: t("contact.subj_press") },
    { value: "ban_appeal", label: t("contact.subj_ban_appeal") },
    { value: "legal", label: t("contact.subj_legal") },
    { value: "other", label: t("contact.subj_other") },
  ];

  const remaining = 1000 - message.length;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, email, subject, message });
    if (!parsed.success) {
      toast({ title: t("contact.error_check"), description: parsed.error.issues[0]?.message ?? t("contact.error_invalid"), variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("contact_submissions").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject,
      message: parsed.data.message,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: t("contact.error_send_title"), description: error.message, variant: "destructive" });
      return;
    }
    setSuccess(true);
    setName(""); setEmail(""); setMessage(""); setSubject("general");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Contact PeakGG — Get in touch"
        description="Reach the PeakGG team for support, bug reports, partnerships, press or ban appeals. We respond within 48 hours."
        path="/contact"
      />
      <Navbar />
      <main className="pt-24 pb-20">
        <section className="container max-w-5xl">
          <div className="text-center mb-12">
            <h1 className="font-display font-black text-5xl md:text-6xl uppercase tracking-tight">
              {t("contact.title_pre")} <span className="text-primary">{t("contact.title_accent")}</span>
            </h1>
            <p className="mt-4 text-muted-foreground font-body">{t("contact.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <Card className="lg:col-span-2 p-6 md:p-8 bg-card/60 border-border">
              {success ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-14 w-14 text-primary mx-auto mb-4" />
                  <h2 className="font-display font-bold text-2xl uppercase mb-2">{t("contact.success_title")}</h2>
                  <p className="text-muted-foreground">{t("contact.success_body")}</p>
                  <Button onClick={() => setSuccess(false)} variant="outline" className="mt-6">{t("contact.send_another")}</Button>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-5">
                  <div>
                    <Label htmlFor="name">{t("contact.name")} *</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value.slice(0, 100))} required maxLength={100} />
                  </div>
                  <div>
                    <Label htmlFor="email">{t("contact.email")} *</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value.slice(0, 255))} required maxLength={255} />
                  </div>
                  <div>
                    <Label htmlFor="subject">{t("contact.subject")}</Label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger id="subject"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="flex justify-between items-center">
                      <Label htmlFor="message">{t("contact.message")} *</Label>
                      <span className={`text-xs ${remaining < 50 ? "text-primary" : "text-muted-foreground"}`}>{t("contact.characters_left", { n: remaining })}</span>
                    </div>
                    <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value.slice(0, 1000))} rows={6} required maxLength={1000} />
                  </div>
                  <Button type="submit" disabled={submitting} size="lg" className="font-display uppercase tracking-wider w-full md:w-auto">
                    {submitting ? t("contact.sending") : t("contact.send")}
                  </Button>
                </form>
              )}
            </Card>

            {/* Info */}
            <div className="space-y-4">
              <Card className="p-5 bg-card/60 border-border">
                <Mail className="h-5 w-5 text-primary mb-2" />
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-display">{t("contact.info_email")}</p>
                <a href="mailto:peakgg.official@gmail.com" className="text-sm font-body hover:text-primary break-all">peakgg.official@gmail.com</a>
              </Card>
              <Card className="p-5 bg-card/60 border-border">
                <MessageSquare className="h-5 w-5 text-primary mb-2" />
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-display">{t("contact.info_discord")}</p>
                <a href="https://discord.gg/peakgg" target="_blank" rel="noopener noreferrer" className="text-sm font-body hover:text-primary">{t("contact.info_discord_text")}</a>
              </Card>
              <Card className="p-5 bg-card/60 border-border">
                <Clock className="h-5 w-5 text-primary mb-2" />
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-display">{t("contact.info_response")}</p>
                <p className="text-sm font-body">{t("contact.info_response_text")}</p>
              </Card>
              <Card className="p-5 bg-card/60 border-border">
                <MapPin className="h-5 w-5 text-primary mb-2" />
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-display">{t("contact.info_location")}</p>
                <p className="text-sm font-body">{t("contact.info_location_text")}</p>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
