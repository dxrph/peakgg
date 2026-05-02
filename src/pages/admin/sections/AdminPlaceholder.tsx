import AdminLayout from "@/components/admin/AdminLayout";
import { Construction } from "lucide-react";

export default function AdminPlaceholder({
  title, description,
}: { title: string; description: string }) {
  return (
    <AdminLayout title={title} description={description}>
      <div className="rounded-lg border border-dashed border-border bg-card/40 p-12 text-center">
        <Construction className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="font-display text-lg">In costruzione (Fase 2)</p>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Questa sezione è stata strutturata e i suoi dati esistono già su Lovable Cloud.
          L'interfaccia completa verrà costruita nel prossimo step.
        </p>
      </div>
    </AdminLayout>
  );
}
