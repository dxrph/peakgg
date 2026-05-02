import { ReactNode } from "react";
import Navbar from "@/components/landing/Navbar";
import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function AdminLayout({ title, description, actions, children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-16 flex">
        <AdminSidebar />
        <main className="flex-1 min-w-0 p-6 md:p-8">
          <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold">{title}</h1>
              {description && (
                <p className="text-sm text-muted-foreground font-body mt-1">{description}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
