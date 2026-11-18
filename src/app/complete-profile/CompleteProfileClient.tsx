
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!value.trim()) return '';
  if (value.trim().startsWith('+')) return `+${digits}`;
  return digits.length === 10 ? `+91${digits}` : `+${digits}`;
}

export default function CompleteProfileClient() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    setUsername(user.username || '');
    setPhone(String(user.unsafeMetadata?.contactPhone || ''));
  }, [user]);

  if (!isLoaded) {
    return <p className="p-10 text-center">Loading account…</p>;
  }

  if (!user) {
    return (
      <div className="p-10 text-center">
        Please{' '}
        <a className="text-orange-600 underline" href="/sign-in">
          sign in
        </a>{' '}
        to continue.
      </div>
    );
  }

  const needsPassword = !user.passwordEnabled;

  const emailName =
    user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'student';

  // Live password requirements
  const passwordRules = [
    {
      label: 'At least 8 characters',
      valid: password.length >= 8,
    },
    {
      label: 'One uppercase letter (A-Z)',
      valid: /[A-Z]/.test(password),
    },
    {
      label: 'One lowercase letter (a-z)',
      valid: /[a-z]/.test(password),
    },
    {
      label: 'One number (0-9)',
      valid: /[0-9]/.test(password),
    },
    {
      label: 'One special character (!@#$%)',
      valid: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const completedRules = passwordRules.filter(
    (rule) => rule.valid
  ).length;

  const isPasswordValid = completedRules === passwordRules.length;

  const passwordsMatch =
    password.length > 0 && password === confirmPassword;

  const inputClass =
    'mt-1 w-full rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100';

  const labelClass =
    'mt-4 block text-sm font-semibold text-slate-900';

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError('');

    try {
      const nextUsername = username.trim();
      const normalizedPhone = normalizePhone(phone);

      if (nextUsername.length < 4) {
        throw new Error('Username must contain at least 4 characters.');
      }

      if (!normalizedPhone) {
        throw new Error('Enter your mobile number.');
      }

      if (needsPassword) {
        if (!isPasswordValid) {
          throw new Error(
            'Password must satisfy all five requirements.'
          );
        }

        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
      }

      if (user.username !== nextUsername) {
        await user.update({ username: nextUsername });
      }

      await user.updateMetadata({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          contactPhone: normalizedPhone,
        },
      });

      if (needsPassword) {
        await user.updatePassword({
          newPassword: password,
        });
      }

      router.replace('/account');
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Could not save your profile.'
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 p-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl">

        <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
          One last step
        </p>

        <h1 className="mt-2 text-2xl font-bold">
          Complete your account
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Add your username, mobile number and{' '}
          {needsPassword ? 'password' : 'contact details'} to continue.
        </p>

        <form onSubmit={saveProfile}>

          {/* Email */}
          <label className="mt-6 block text-sm font-semibold">
            Email address
          </label>

          <input
            type="email"
            value={user.primaryEmailAddress?.emailAddress || ''}
            readOnly
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500"
          />

          {/* Username */}
          <label className={labelClass}>
            Username *
          </label>

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={4}
            maxLength={64}
            required
            placeholder={emailName}
            className={inputClass}
          />

          {/* Mobile number */}
          <label className={labelClass}>
            Mobile number *
          </label>

          <input
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="Without +91"
            className={inputClass}
          />

          {needsPassword && (
            <>
              {/* Password */}
              <label className={labelClass}>
                Password *
              </label>

              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                minLength={8}
                required
                placeholder="Create a strong password"
                className={inputClass}
              />

              {/* Live password requirements */}
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">

                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-700">
                    Password requirements
                  </p>

                  <span
                    className={`text-xs font-semibold ${
                      isPasswordValid
                        ? 'text-green-600'
                        : 'text-slate-500'
                    }`}
                  >
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

                {/* Individual requirements */}
                <div className="space-y-2" aria-live="polite">
                  {passwordRules.map((rule) => (
                    <div
                      key={rule.label}
                      className="flex items-center gap-2"
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                          rule.valid
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {rule.valid ? '✓' : '×'}
                      </span>

                      <span
                        className={`text-xs ${
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

              {/* Confirm password */}
              <label className={labelClass}>
                Confirm password *
              </label>

              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                minLength={8}
                required
                placeholder="Enter password again"
                className={inputClass}
              />

              {confirmPassword.length > 0 && (
                <p
                  className={`mt-1.5 text-xs ${
                    passwordsMatch
                      ? 'text-green-600'
                      : 'text-red-500'
                  }`}
                >
                  {passwordsMatch
                    ? '✓ Passwords match'
                    : 'Passwords do not match'}
                </p>
              )}
            </>
          )}

          {/* Error */}
          {error && (
            <p
              role="alert"
              className="mt-3 text-sm text-red-600"
            >
              {error}
            </p>
          )}

          {/* Save */}
          <button
            type="submit"
            disabled={pending}
            className="mt-5 w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:opacity-50"
          >
            {pending ? 'Saving…' : 'Save and continue'}
          </button>

        </form>
      </section>
    </main>
  );
}
