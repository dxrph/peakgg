import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

// ──────────────────────────────────────────────────────────────────────────
// Password rules
// ──────────────────────────────────────────────────────────────────────────

export const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .max(128, { message: "Password must be less than 128 characters" })
  .regex(/[A-Z]/, { message: "Add at least one uppercase letter" })
  .regex(/[0-9]/, { message: "Add at least one number" })
  .regex(/[^A-Za-z0-9]/, { message: "Add at least one special character" });

export function describePasswordRules(): string[] {
  return [
    "At least 8 characters",
    "At least one uppercase letter",
    "At least one number",
    "At least one special character",
  ];
}

// Strength score 0-4 for the meter
export function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Too weak", "Weak", "Fair", "Strong", "Excellent"] as const;
  return { score: score as 0 | 1 | 2 | 3 | 4, label: labels[score] };
}

// ──────────────────────────────────────────────────────────────────────────
// Email
// ──────────────────────────────────────────────────────────────────────────

export const emailSchema = z
  .string()
  .trim()
  .email({ message: "Invalid email address" })
  .max(255, { message: "Email is too long" });

/** Server-checked disposable-email lookup using the public.is_disposable_email RPC. */
export async function isDisposableEmail(email: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_disposable_email", { _email: email });
  if (error) return false; // fail-open on RPC error to avoid blocking legitimate signups
  return Boolean(data);
}

// ──────────────────────────────────────────────────────────────────────────
// Username
// ──────────────────────────────────────────────────────────────────────────

export const usernameSchema = z
  .string()
  .trim()
  .min(3, { message: "Username must be at least 3 characters" })
  .max(20, { message: "Username must be at most 20 characters" })
  .regex(/^[A-Za-z0-9_]+$/, {
    message: "Username can only contain letters, numbers, and underscores",
  });

// ──────────────────────────────────────────────────────────────────────────
// Free-text content limits (chat, bio, clip titles, etc.)
// ──────────────────────────────────────────────────────────────────────────

export const CONTENT_LIMITS = {
  bio: 160,
  chatMessage: 200,
  clipTitle: 80,
  displayName: 40,
  contactMessage: 1000,
} as const;

/**
 * Strip HTML tags and dangerous control characters from a free-text input.
 * For display safety we ALSO rely on React's default escaping; this is
 * defense-in-depth so we never store raw HTML.
 */
export function sanitizeText(input: string): string {
  if (!input) return "";
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "") // control chars
    .replace(/<\/?[a-zA-Z][^>]*>/g, "") // any HTML tags
    .replace(/javascript:/gi, "")
    .trim();
}

// ──────────────────────────────────────────────────────────────────────────
// File upload validation (avatars, banners, clips)
// ──────────────────────────────────────────────────────────────────────────

export type FileKind = "avatar" | "banner" | "clip";

const FILE_RULES: Record<
  FileKind,
  { maxBytes: number; mimes: readonly string[]; exts: readonly string[]; label: string }
> = {
  avatar: {
    maxBytes: 2 * 1024 * 1024,
    mimes: ["image/jpeg", "image/png", "image/webp"],
    exts: ["jpg", "jpeg", "png", "webp"],
    label: "JPG, PNG or WebP, max 2 MB",
  },
  banner: {
    maxBytes: 5 * 1024 * 1024,
    mimes: ["image/jpeg", "image/png", "image/webp"],
    exts: ["jpg", "jpeg", "png", "webp"],
    label: "JPG, PNG or WebP, max 5 MB",
  },
  clip: {
    maxBytes: 50 * 1024 * 1024,
    mimes: ["video/mp4", "video/webm"],
    exts: ["mp4", "webm"],
    label: "MP4 or WebM, max 50 MB",
  },
};

export function validateUpload(
  file: File,
  kind: FileKind,
): { ok: true; ext: string } | { ok: false; error: string } {
  const rule = FILE_RULES[kind];
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!rule.mimes.includes(file.type) && !rule.exts.includes(ext)) {
    return { ok: false, error: `Unsupported file format. Allowed: ${rule.label}` };
  }
  if (file.size === 0) return { ok: false, error: "The file is empty or corrupted." };
  if (file.size > rule.maxBytes) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    const maxMb = rule.maxBytes / (1024 * 1024);
    return { ok: false, error: `File too large (${mb} MB). Maximum ${maxMb} MB.` };
  }
  return { ok: true, ext };
}

/** Random opaque filename — never reuse the user-supplied name. */
export function randomFileName(ext: string): string {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${id}.${ext}`;
}