import type { User } from "@supabase/supabase-js";

import { supabase } from "./supabase";

const CLAIM_STORAGE_KEY = "recess:claim";

interface ClaimData {
  sentenceId: string;
  anonUserId: string;
}

function isAlreadyRegistered(error: {
  message?: string;
  code?: string;
}): boolean {
  return error.code === "email_exists";
}

export type AuthFlow = "upgrade" | "signin" | "error";

export interface StartEmailAuthResult {
  flow: AuthFlow;
  error?: string;
  code?: string;
}

/**
 * Initiates email OTP auth, branching on whether the caller is an anonymous
 * user or not, and whether the email is already registered.
 *
 * - Anon + new email   → updateUser (upgrade), flow 'upgrade'
 * - Anon + taken email → stash claim, signInWithOtp, flow 'signin'
 * - No/permanent user  → signInWithOtp, flow 'signin'
 */
export async function startEmailAuth(
  email: string,
  sentenceId?: string | null,
): Promise<StartEmailAuthResult> {
  const { data: claimsData } = await supabase.auth.getClaims();
  const isAnon = claimsData?.claims?.is_anonymous === true;
  // Capture the anon uid NOW, while still anonymous, before any session swap.
  const anonUserId = claimsData?.claims?.sub as string | undefined;

  if (isAnon) {
    const { error: updateError } = await supabase.auth.updateUser({ email });

    if (updateError) {
      if (isAlreadyRegistered(updateError)) {
        // NEVER surface an "email exists" message to the user — that is account
        // enumeration. Silently fall through to the OTP signin path instead.
        if (sentenceId && anonUserId) {
          const claimData: ClaimData = { sentenceId, anonUserId };
          sessionStorage.setItem(CLAIM_STORAGE_KEY, JSON.stringify(claimData));
        }
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
        });
        if (otpError)
          return {
            flow: "error",
            error: otpError.message,
            code: otpError.code,
          };
        return { flow: "signin" };
      }
      return {
        flow: "error",
        error: updateError.message,
        code: updateError.code,
      };
    }

    return { flow: "upgrade" };
  }

  // No user or permanent user: standard OTP sign-in (creates account if new).
  const { error: otpError } = await supabase.auth.signInWithOtp({ email });
  if (otpError)
    return { flow: "error", error: otpError.message, code: otpError.code };
  return { flow: "signin" };
}

export interface VerifyEmailAuthResult {
  ok: boolean;
  error?: string;
  code?: string;
  user?: User;
}

/**
 * Verifies the OTP code. For the 'signin' flow, checks sessionStorage for a
 * stashed claim and moves the anonymous user's sentence to their permanent
 * account via RPC. Always refreshes the session so is_anonymous flips
 * immediately in the live JWT.
 */
export async function verifyEmailAuth(
  email: string,
  code: string,
  flow: "upgrade" | "signin",
): Promise<VerifyEmailAuthResult> {
  const type = flow === "upgrade" ? "email_change" : "email";

  const { data, error: verifyError } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type,
  });

  if (verifyError) {
    return { ok: false, error: verifyError.message, code: verifyError.code };
  }

  if (flow === "signin") {
    const raw = sessionStorage.getItem(CLAIM_STORAGE_KEY);
    if (raw) {
      try {
        const { sentenceId, anonUserId } = JSON.parse(raw) as ClaimData;
        await supabase.rpc("claim_anon_sentence", {
          sentence_id: sentenceId,
          anon_user_id: anonUserId,
        });
      } catch {
        console.warn("claim_anon_sentence failed");
      } finally {
        sessionStorage.removeItem(CLAIM_STORAGE_KEY);
      }
    }
  }

  // Refresh to update is_anonymous in JWT immediately
  await supabase.auth.refreshSession();

  return { ok: true, user: data?.user ?? undefined };
}
