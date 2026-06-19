import { X } from "lucide-react";
import { useState } from "react";

import { supabase } from "../../lib/supabase";

export type AuthReason = "save" | "like" | "account";

interface AuthModalProps {
  reason: AuthReason;
  onClose: () => void;
  onSuccess: () => void;
}

const REASON_COPY: Record<AuthReason, { title: string; subtitle: string }> = {
  save: {
    title: "log in to save this",
    subtitle: "Create an account to keep this entry on your profile.",
  },
  like: {
    title: "log in to like",
    subtitle: "Create an account to like sentences in today's feed.",
  },
  account: {
    title: "create an account",
    subtitle: "Save your writes and likes across sessions.",
  },
};

function friendlyError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("already") &&
    (lower.includes("registered") || lower.includes("exist"))
  ) {
    return "That email is already linked to another account. Try a different one or log in there.";
  }
  if (lower.includes("password")) {
    return "Password must be at least 6 characters.";
  }
  return message || "Something went wrong. Please try again.";
}

export function AuthModal({ reason, onClose, onSuccess }: AuthModalProps) {
  // Mounted fresh by the provider each time it opens, so state starts clean.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy = REASON_COPY[reason];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    // Manual linking: upgrade the CURRENT anonymous user to a permanent one.
    // auth.uid() is preserved, so already-written rows stay owned by them.
    const { error: updateError } = await supabase.auth.updateUser({
      email: email.trim(),
      password,
    });

    if (updateError) {
      setError(friendlyError(updateError.message));
      setSubmitting(false);
      return;
    }

    // Refresh the JWT so is_anonymous flips to false immediately; otherwise the
    // old token still reads anonymous for up to ~1 hour and Like/Save stay blocked.
    await supabase.auth.refreshSession();

    setSubmitting(false);
    onSuccess();
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-[400px] flex-col gap-5"
        style={{
          position: "relative",
          background: "rgba(15,15,20,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "16px",
          padding: "2rem",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 cursor-pointer text-white/40 transition-colors duration-200 hover:text-white/70"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col gap-1.5">
          <h2 className="font-heading text-2xl font-semibold text-white lowercase">
            {copy.title}
          </h2>
          <p className="text-sm leading-relaxed text-white/55">
            {copy.subtitle}
          </p>
        </div>

        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
            className="w-full rounded-xl text-base text-white placeholder:text-white/30 focus:outline-none"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              padding: "0.75rem 1rem",
            }}
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            autoComplete="new-password"
            className="w-full rounded-xl text-base text-white placeholder:text-white/30 focus:outline-none"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              padding: "0.75rem 1rem",
            }}
          />

          {error && (
            <p className="text-sm leading-relaxed text-rose-300/90">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={`mt-1 flex w-full items-center justify-center rounded-full text-base font-semibold tracking-wide transition-all duration-300 ${
              submitting
                ? "cursor-not-allowed bg-white/40 text-black/50"
                : "cursor-pointer bg-white/90 text-black hover:bg-white"
            }`}
            style={{
              border: "1px solid rgba(255,255,255,0.15)",
              paddingTop: "0.75rem",
              paddingBottom: "0.75rem",
            }}
          >
            {submitting ? "linking…" : "continue →"}
          </button>
        </form>

        {/* TODO: add magic-link / OTP as an alternative sign-in path. */}
        {/* TODO: add a "log in to existing account" path for returning users. */}
      </div>
    </div>
  );
}
