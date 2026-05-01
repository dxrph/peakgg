import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Shield,
  Download,
  Trash2,
  Loader2,
  AlertTriangle,
  Clock,
  Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type GdprRequest = {
  id: string;
  type: "delete" | "export";
  status: "pending" | "processing" | "completed" | "cancelled" | "failed";
  scheduled_for: string | null;
  completed_at: string | null;
  export_url: string | null;
  created_at: string;
};

const GRACE_DAYS = 30;

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [requests, setRequests] = useState<GdprRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const loadRequests = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("gdpr_requests")
      .select("id, type, status, scheduled_for, completed_at, export_url, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setRequests((data ?? []) as GdprRequest[]);
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const pendingDelete = requests.find(
    (r) => r.type === "delete" && r.status === "pending",
  );

  const requestExport = async () => {
    if (!user) return;
    setWorking(true);
    const { error } = await supabase.from("gdpr_requests").insert({
      user_id: user.id,
      type: "export",
      status: "pending",
    });
    setWorking(false);
    if (error) {
      toast.error("Could not submit export request. Try again later.");
      return;
    }
    toast.success("Export request received. You'll be notified when ready (within 48 hours).");
    loadRequests();
  };

  const requestDelete = async () => {
    if (!user) return;
    setWorking(true);
    const scheduledFor = new Date();
    scheduledFor.setDate(scheduledFor.getDate() + GRACE_DAYS);
    const { error } = await supabase.from("gdpr_requests").insert({
      user_id: user.id,
      type: "delete",
      status: "pending",
      scheduled_for: scheduledFor.toISOString(),
    });
    setWorking(false);
    if (error) {
      toast.error("Could not submit deletion request. Try again later.");
      return;
    }
    toast.success(`Account scheduled for deletion in ${GRACE_DAYS} days. Sign in any time to cancel.`);
    loadRequests();
  };

  const cancelDelete = async () => {
    if (!pendingDelete) return;
    setWorking(true);
    const { error } = await supabase
      .from("gdpr_requests")
      .update({ status: "cancelled" })
      .eq("id", pendingDelete.id);
    setWorking(false);
    if (error) {
      toast.error("Could not cancel deletion. Try again.");
      return;
    }
    toast.success("Deletion cancelled. Welcome back!");
    loadRequests();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container max-w-3xl pt-24 pb-16">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-display font-bold">Settings & Privacy</h1>
            <p className="text-sm text-muted-foreground font-body">
              Manage your account and data.
            </p>
          </div>
        </div>

        {/* Pending deletion banner */}
        {pendingDelete && (
          <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/5 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-display font-semibold mb-1">
                Account scheduled for deletion
              </h3>
              <p className="text-sm text-muted-foreground font-body mb-3">
                Your account will be permanently deleted on{" "}
                <strong className="text-foreground">
                  {new Date(pendingDelete.scheduled_for!).toLocaleDateString()}
                </strong>
                . Cancel any time before then to keep your account.
              </p>
              <Button size="sm" variant="outline" onClick={cancelDelete} disabled={working}>
                {working ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Cancel deletion
              </Button>
            </div>
          </div>
        )}

        {/* Data export */}
        <section className="rounded-lg border border-border bg-card p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="font-display font-semibold text-lg mb-1">Download my data</h2>
              <p className="text-sm text-muted-foreground font-body mb-4">
                Get a JSON export of everything we have on your account: profile, matches,
                notifications, and chat messages. Available within 48 hours.
              </p>
              <Button onClick={requestExport} disabled={working || !user}>
                {working ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Request data export
              </Button>
            </div>
          </div>
        </section>

        {/* Account deletion */}
        <section className="rounded-lg border border-destructive/30 bg-destructive/[0.02] p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-destructive/10 p-2.5">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <h2 className="font-display font-semibold text-lg mb-1">Delete my account</h2>
              <p className="text-sm text-muted-foreground font-body mb-4">
                Permanently delete your profile, messages, notifications, and personal data.
                Match history is anonymized to preserve opponent stats. You have a{" "}
                <strong className="text-foreground">{GRACE_DAYS} day</strong> grace period to
                change your mind.
              </p>
              {!pendingDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={working || !user}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Request account deletion
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete your PeakGG account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Your account will be scheduled for deletion in {GRACE_DAYS} days. During
                        that window you can cancel from this page. After {GRACE_DAYS} days the
                        deletion is permanent and cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep my account</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={requestDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Yes, schedule deletion
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </section>

        {/* Request history */}
        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Request history
          </h2>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body">No requests yet.</p>
          ) : (
            <ul className="space-y-2">
              {requests.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between text-sm font-body py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2">
                    {r.status === "completed" ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : r.status === "cancelled" ? (
                      <X className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Clock className="h-4 w-4 text-warning" />
                    )}
                    <span className="capitalize">{r.type}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-display uppercase tracking-wider ${
                        r.status === "completed"
                          ? "bg-success/15 text-success"
                          : r.status === "cancelled" || r.status === "failed"
                            ? "bg-muted text-muted-foreground"
                            : "bg-warning/15 text-warning"
                      }`}
                    >
                      {r.status}
                    </span>
                    {r.export_url && (
                      <a
                        href={r.export_url}
                        download
                        className="text-xs text-primary hover:underline"
                      >
                        Download
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-xs text-muted-foreground font-body mt-8 text-center">
          Questions about your data? <Link to="/" className="text-primary hover:underline">Contact us</Link> · See our{" "}
          <Link to="/" className="text-primary hover:underline">Privacy Policy</Link>.
        </p>

        {pendingDelete && (
          <div className="mt-8 text-center">
            <Button variant="ghost" size="sm" onClick={signOut}>
              Sign out
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function X(props: React.SVGProps<SVGSVGElement>) {
  // Local fallback so we don't add another import; mirrors lucide-react's X.
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}