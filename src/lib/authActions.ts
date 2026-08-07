import { getOAuthRedirectTo } from './oauthRedirect';
import { supabase } from './supabaseClient';

export async function signInWithOAuthProvider(
  provider: 'google' | 'github'
): Promise<{ error: any | null }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: getOAuthRedirectTo() },
  });

  return { error };
}

export async function sendMagicLink(
  email: string
): Promise<{ error: any | null }> {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    return { error: new Error('Email is required') };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: trimmedEmail,
    options: {
      emailRedirectTo: getOAuthRedirectTo(),
    },
  });

  return { error };
}