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
    <div className="page-shell admin-shell">
      <Navbar />
      <div className="pt-16 flex">
        <AdminSidebar />
        <main className="flex-1 min-w-0 p-5 md:p-8 lg:p-10">
          <header className="mb-8 md:mb-10 flex items-end justify-between gap-4 flex-wrap border-b border-border pb-6">
            <div>
              <p className="eyebrow mb-2">// Operations control</p>
              <h1 className="brush-title text-3xl md:text-5xl uppercase font-display font-bold">{title}</h1>
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

