import { Library, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { startEmailAuth, verifyEmailAuth } from "../../lib/emailAuth";

export type AuthReason = "save" | "like" | "account";

interface AuthModalProps {
  reason: AuthReason;
  sentenceId?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const RESEND_COOLDOWN_S = 45;

// "otp_expired" is returned for both wrong and expired codes.
function friendlyError(message: string, code?: string): string {
  if (code === "otp_expired") {
    return "Invalid or expired code. Try again or resend.";
  }
  const lower = message.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  return message || "Something went wrong. Please try again.";
}

type View = "email" | "code";

export function AuthModal({
  reason: _reason,
  sentenceId,
  onClose,
  onSuccess,
}: AuthModalProps) {
  const [view, setView] = useState<View>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [flow, setFlow] = useState<"upgrade" | "signin">("signin");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  function startCooldown() {
    setResendCooldown(RESEND_COOLDOWN_S);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(cooldownRef.current!);
          cooldownRef.current = null;
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    const result = await startEmailAuth(email.trim(), sentenceId);

    if (result.flow === "error") {
      setError(friendlyError(result.error ?? "", result.code));
      setSubmitting(false);
      return;
    }

    // result.flow is narrowed to "upgrade" | "signin" here
    setFlow(result.flow as "upgrade" | "signin");
    setView("code");
    startCooldown();
    setSubmitting(false);
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    const result = await verifyEmailAuth(email.trim(), code.trim(), flow);

    if (!result.ok) {
      setError(friendlyError(result.error ?? "", result.code));
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    onSuccess();
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || submitting) return;
    setError(null);

    const result = await startEmailAuth(email.trim(), sentenceId);
    if (result.flow === "error") {
      setError(friendlyError(result.error ?? "", result.code));
      return;
    }
    setFlow(result.flow as "upgrade" | "signin");
    startCooldown();
  };

  const handleBack = () => {
    setView("email");
    setCode("");
    setError(null);
    if (cooldownRef.current) {
      clearInterval(cooldownRef.current);
      cooldownRef.current = null;
    }
    setResendCooldown(0);
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
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "16px",
          padding: "1.75rem",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 cursor-pointer text-white/40 transition-colors duration-200 hover:text-white/70"
        >
          <X size={22} strokeWidth={2.5} />
        </button>

        {view === "email" ? (
          <>
            <div className="flex flex-col items-center gap-3 text-center">
              <Library size={48} style={{ color: "#5660c0" }} />
              <h2 className="font-heading text-3xl font-bold text-white">
                Welcome to Recess
              </h2>
            </div>
            <div className="flex flex-col items-center text-center text-sm leading-relaxed text-white/55">
              <span>Enter your email to continue.</span>
              <span>We'll send a 6-digit code — no password needed.</span>
            </div>

            <form
              className="flex flex-col gap-3"
              style={{ marginTop: "1.75rem" }}
              onSubmit={handleEmailSubmit}
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-white/50">Email address</label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full rounded-xl text-base text-white placeholder:text-white/30 focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    padding: "0.75rem 1rem",
                  }}
                />
              </div>

              {error && (
                <p
                  className="text-xs leading-relaxed text-rose-300/90"
                  style={{ marginLeft: "1rem" }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={`mt-1 flex w-full items-center justify-center rounded-full text-base font-semibold tracking-wide transition-all duration-300 ${
                  submitting
                    ? "cursor-not-allowed bg-white/20 text-white/40"
                    : "cursor-pointer bg-white text-black hover:bg-white/90"
                }`}
                style={{
                  marginTop: "0.25rem",
                  paddingTop: "0.75rem",
                  paddingBottom: "0.75rem",
                }}
              >
                {submitting ? "Sending…" : "Continue"}
              </button>

              <p className="text-center text-xs leading-relaxed text-white/40">
                By continuing, you agree to our{" "}
                <a
                  href="/terms.html"
                  target="_blank"
                  rel="noopener"
                  className="underline underline-offset-2 transition-colors duration-200 hover:text-white/70"
                >
                  Terms
                </a>{" "}
                and{" "}
                <a
                  href="/privacy.html"
                  target="_blank"
                  rel="noopener"
                  className="underline underline-offset-2 transition-colors duration-200 hover:text-white/70"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </form>
          </>
        ) : (
          <form className="flex flex-col gap-3" onSubmit={handleCodeSubmit}>
            <p className="text-sm leading-relaxed text-white/55">
              We sent a 6-digit code to{" "}
              <span className="text-white/80">{email}</span>.
            </p>

            <input
              type="text"
              required
              autoFocus
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              autoComplete="one-time-code"
              className="w-full rounded-xl text-center font-mono text-xl tracking-[0.3em] text-white placeholder:text-white/30 focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.15)",
                padding: "0.75rem 1rem",
              }}
            />

            {error && (
              <p
                className="text-xs leading-relaxed text-rose-300/90"
                style={{ marginLeft: "1rem" }}
              >
                {error}
              </p>
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
              {submitting ? "Verifying…" : "Verify →"}
            </button>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="cursor-pointer text-sm text-white/40 transition-colors duration-200 hover:text-white/70"
              >
                ← back
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || submitting}
                className={`text-sm transition-colors duration-200 ${
                  resendCooldown > 0 || submitting
                    ? "cursor-not-allowed text-white/25"
                    : "cursor-pointer text-white/50 hover:text-white/80"
                }`}
              >
                {resendCooldown > 0
                  ? `resend in ${resendCooldown}s`
                  : "resend code"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
