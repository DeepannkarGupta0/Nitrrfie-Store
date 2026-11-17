
'use client';

import { useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!value.trim()) return '';
  if (value.trim().startsWith('+')) return `+${digits}`;
  return digits.length === 10 ? `+91${digits}` : `+${digits}`;
}

export default function SignUpPageClient() {
  const { signUp, fetchStatus } = useSignUp();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const busy = pending || fetchStatus === 'fetching';

  // Derive password requirements directly from current input.
  const passwordRules = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'One uppercase letter (A-Z)', valid: /[A-Z]/.test(password) },
    { label: 'One lowercase letter (a-z)', valid: /[a-z]/.test(password) },
    { label: 'One number (0-9)', valid: /[0-9]/.test(password) },
    { label: 'One special character (!@#$%)', valid: /[^A-Za-z0-9]/.test(password) },
  ];

  const completedRules = passwordRules.filter((rule) => rule.valid).length;
  const isPasswordValid = completedRules === passwordRules.length;

  async function finalizeSignUp() {
    const { error: finalizeError } = await signUp.finalize({
      navigate: ({ decorateUrl }) => {
        const destination = decorateUrl('/account');

        if (destination.startsWith('http')) {
          window.location.href = destination;
        } else {
          router.replace(destination);
        }
      },
    });

    if (finalizeError) throw new Error(finalizeError.message);
  }

  async function submitSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Please fulfill all password requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone) {
      setError('Enter your mobile number.');
      return;
    }

    setPending(true);

    try {
      const { error: createError } = await signUp.create({
        emailAddress: email.trim(),
        username: username.trim(),
        password,
        unsafeMetadata: {
          contactPhone: normalizedPhone,
        },
      });

      if (createError) throw new Error(createError.message);

      if (signUp.status === 'complete') {
        await finalizeSignUp();
        return;
      }

      const { error: verificationError } =
        await signUp.verifications.sendEmailCode();

      if (verificationError) throw new Error(verificationError.message);

      setStep('verify');
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not create your account.'
      );
    } finally {
      setPending(false);
    }
  }

  async function verifyEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError('');

    try {
      const { error: verificationError } =
        await signUp.verifications.verifyEmailCode({
          code: code.trim(),
        });

      if (verificationError) throw new Error(verificationError.message);

      if (signUp.status === 'complete') {
        await finalizeSignUp();
      } else {
        throw new Error('Email verification is incomplete. Please try again.');
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Email verification failed.'
      );
    } finally {
      setPending(false);
    }
  }

  async function continueWithGoogle() {
    setPending(true);
    setError('');

    try {
      const { error: ssoError } = await signUp.sso({
        strategy: 'oauth_google',
        redirectCallbackUrl: '/sso-callback',
        redirectUrl: '/auth/google-complete',
      });

      if (ssoError) throw new Error(ssoError.message);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Google sign-up failed.'
      );
      setPending(false);
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100';

  const labelClass =
    'mb-1 block text-sm font-semibold text-slate-900';

  return (
    <main className="flex min-h-[75vh] w-full items-center justify-center bg-cream px-4 py-8">
      <section className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_12px_35px_rgba(15,23,42,0.10)] sm:p-9">

        <h1 className="auth-heading text-center text-xl font-semibold text-slate-900">
          {step === 'form' ? 'Sign up to NITRRFIE Store' : 'Verify your email'}
        </h1>

        <p className="mt-2 text-center text-sm leading-6 text-slate-500">
          {step === 'form'
            ? 'Create your account to get started.'
            : `Enter the verification code sent to ${email}.`}
        </p>

        {step === 'form' ? (
          <>
            <form onSubmit={submitSignUp} className="mt-6 space-y-4">

              <div>
                <label htmlFor="signup-email" className={labelClass}>
                  Email address *
                </label>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="signup-username" className={labelClass}>
                  Username *
                </label>
                <input
                  id="signup-username"
                  type="text"
                  autoComplete="username"
                  required
                  minLength={4}
                  maxLength={64}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputClass}
                  placeholder="Choose a username"
                />
              </div>

              <div>
                <label htmlFor="signup-phone" className={labelClass}>
                  Mobile number *
                </label>
                <input
                  id="signup-phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                  placeholder="Without +91"
                />
              </div>

              {/* Password field and live validation */}
              <div>
                <label htmlFor="signup-password" className={labelClass}>
                  Password *
                </label>

                <input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => {
                    const currentPassword = event.currentTarget.value;
                    setPassword(currentPassword);
                    setError('');
                  }}
                  className={inputClass}
                  placeholder="Create a strong password"
                />

                {/* Live password strength and requirements */}
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">

                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-700">
                      Password requirements
                    </p>

                    <span className={`text-xs font-semibold ${
                      isPasswordValid ? 'text-green-600' : 'text-slate-500'
                    }`}>
                      {completedRules}/5 completed
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all duration-300"
                      style={{
                        width: `${(completedRules / 5) * 100}%`,
                      }}
                    />
                  </div>

                  {/* Individual live requirements */}
                  <div className="space-y-2" aria-live="polite">
                    {passwordRules.map((rule) => (
                      <div
                        key={rule.label}
                        className="flex items-center gap-2"
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                            rule.valid
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {rule.valid ? '✓' : '×'}
                        </span>

                        <span
                          className={`text-xs transition-colors ${
                            rule.valid
                              ? 'font-medium text-green-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {rule.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="signup-confirm-password"
                  className={labelClass}
                >
                  Confirm password *
                </label>

                <input
                  id="signup-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  className={inputClass}
                  placeholder="Enter password again"
                />

                {confirmPassword.length > 0 && (
                  <p className={`mt-1.5 text-xs ${
                    password === confirmPassword
                      ? 'text-green-600'
                      : 'text-red-500'
                  }`}>
                    {password === confirmPassword
                      ? '✓ Passwords match'
                      : 'Passwords do not match'}
                  </p>
                )}
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              OR
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={continueWithGoogle}
              disabled={busy}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Continue with Google
            </button>
          </>
        ) : (
          <form onSubmit={verifyEmail} className="mt-6 space-y-4">
            <div>
              <label htmlFor="signup-code" className={labelClass}>
                Email verification code *
              </label>
              <input
                id="signup-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`${inputClass} tracking-widest`}
                placeholder="Enter the code from your email"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"
            >
              {busy ? 'Verifying…' : 'Verify email and continue'}
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setStep('form');
                setCode('');
                setError('');
              }}
              className="w-full text-sm text-slate-600 underline"
            >
              Back to registration
            </button>
          </form>
        )}

        <div id="clerk-captcha" />

        <p className="mt-5 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <a
            href="/sign-in"
            className="font-semibold text-orange-700 underline"
          >
            Sign in
          </a>
        </p>
      </section>
    </main>
  );
}
