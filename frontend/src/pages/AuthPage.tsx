import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  User,
} from 'lucide-react';
import logo from '../logo.png';
import googleIcon from '../google.svg';

type AuthMode = 'login' | 'register';

type FieldErrors = Partial<Record<'name' | 'email' | 'password' | 'confirmPassword' | 'terms', string>>;

type Props = {
  backendStatus: 'idle' | 'loading' | 'connected' | 'error';
  backendError: string | null;
  onLogin: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  onGoogleLogin: (code: string) => Promise<void>;
  onRegister: (input: { name: string; email: string; password: string;}) => Promise<void>;
  onClearError: () => void;
};

const GOOGLE_SCRIPT_ID = 'google-identity-services-script';

const loadGoogleIdentityScript = async () => {
  if (typeof window === 'undefined') {
    throw new Error('Window is not available');
  }

  if ((window as any).google?.accounts?.id) {
    return;
  }

  const existing = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    await new Promise<void>((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Google script failed to load')), { once: true });
    });
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google script failed to load'));
    document.head.appendChild(script);
  });
};

export const AuthPage: React.FC<Props> = ({
  backendStatus,
  backendError,
  onLogin,
  onGoogleLogin,
  onRegister,
  onClearError
}) => {
  const { t } = useTranslation();
  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim();
  const googleCodeClientRef = useRef<any>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [googleLoading, setGoogleLoading] = useState(false);

  const switchMode = (mode: AuthMode) => {
    onClearError();
    setLocalError(null);
    setFieldErrors({});
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setAcceptedTerms(false);
    setAuthMode(mode);
  };

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const startGoogleLogin = () => {
    onClearError();
    setLocalError(null);

    if (googleLoading || backendStatus === 'loading') {
      return;
    }

    if (!googleCodeClientRef.current) {
      setLocalError(t('auth.errors.googleUnavailable'));
      return;
    }

    setGoogleLoading(true);
    googleCodeClientRef.current.requestCode();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    onClearError();
    setLocalError(null);

    const normalizedName = name.trim();
    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();
    const normalizedConfirmPassword = confirmPassword.trim();
    const nextFieldErrors: FieldErrors = {};

    if (authMode === 'register' && !normalizedName) {
      nextFieldErrors.name = t('auth.errors.requiredField');
    }
    if (!normalizedEmail) {
      nextFieldErrors.email = t('auth.errors.requiredField');
    }
    if (!normalizedPassword) {
      nextFieldErrors.password = t('auth.errors.requiredField');
    }
    if (authMode === 'register' && !normalizedConfirmPassword) {
      nextFieldErrors.confirmPassword = t('auth.errors.requiredField');
    }
    if (authMode === 'register' && !acceptedTerms) {
      nextFieldErrors.terms = t('auth.errors.acceptTermsRequired');
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    if (authMode === 'register') {
      if (normalizedPassword.length < 8) {
        setLocalError(t('auth.errors.passwordMinLength'));
        return;
      }

      if (normalizedPassword !== normalizedConfirmPassword) {
        setLocalError(t('auth.errors.passwordsDoNotMatch'));
        return;
      }

      await onRegister({
        name: normalizedName,
        email: normalizedEmail,
        password: normalizedPassword,
      });
      return;
    }

    await onLogin(normalizedEmail, normalizedPassword, rememberMe);
  };

  useEffect(() => {
    let cancelled = false;

    const initializeGoogleClient = async () => {
      setLocalError(null);

      if (authMode !== 'login') {
        googleCodeClientRef.current = null;
        return;
      }

      if (!googleClientId) {
        setLocalError(t('auth.errors.googleClientIdMissing'));
        return;
      }

      try {
        setGoogleLoading(true);
        await loadGoogleIdentityScript();

        if (cancelled) return;

        const googleApi = (window as any).google;
        if (!googleApi?.accounts?.oauth2) {
          throw new Error(t('auth.errors.googleUnavailable'));
        }

        googleCodeClientRef.current = googleApi.accounts.oauth2.initCodeClient({
          client_id: googleClientId,
          scope: 'openid email profile',
          ux_mode: 'popup',
          callback: async (response: { code?: string; error?: string; error_description?: string }) => {
            if (response.error) {
              setLocalError(response.error_description || t('auth.errors.googleUnavailable'));
              setGoogleLoading(false);
              return;
            }

            if (!response.code) {
              setLocalError(t('auth.errors.googleCredentialMissing'));
              setGoogleLoading(false);
              return;
            }

            try {
              setGoogleLoading(true);
              await onGoogleLogin(response.code);
            } catch (error) {
              setLocalError(error instanceof Error ? error.message : t('auth.errors.googleUnavailable'));
            } finally {
              setGoogleLoading(false);
            }
          },
          error_callback: (error: { type?: string }) => {
            if (error?.type === 'popup_failed_to_open') {
              setLocalError(t('auth.errors.googlePopupFailedToOpen'));
            } else if (error?.type === 'popup_closed') {
              setLocalError(t('auth.errors.googlePopupClosed'));
            } else {
              setLocalError(t('auth.errors.googleUnavailable'));
            }
            setGoogleLoading(false);
          }
        });

        setGoogleLoading(false);
      } catch (error) {
        if (!cancelled) {
          setLocalError(error instanceof Error ? error.message : t('auth.errors.googleUnavailable'));
          setGoogleLoading(false);
        }
      }
    };

    void initializeGoogleClient();

    return () => {
      cancelled = true;
      googleCodeClientRef.current = null;
    };
  }, [authMode, googleClientId, onGoogleLogin, t]);

  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#f6faff] text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_18%,rgba(37,99,235,0.16),transparent_28%),radial-gradient(circle_at_95%_80%,rgba(59,130,246,0.20),transparent_30%),linear-gradient(115deg,#ffffff_0%,#f8fbff_45%,#eaf4ff_100%)] dark:bg-[radial-gradient(circle_at_8%_18%,rgba(59,130,246,0.22),transparent_28%),radial-gradient(circle_at_95%_80%,rgba(37,99,235,0.20),transparent_30%),linear-gradient(115deg,#020617_0%,#0f172a_45%,#111827_100%)]" />
        <div className="absolute -left-28 bottom-0 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl dark:bg-blue-500/10" />

        <div className="relative mx-auto grid min-h-screen w-full max-w-3xl grid-cols-1 items-center px-5 py-8 sm:px-8 lg:px-12">
          <section className="mx-auto w-full max-w-2xl">
            <form
              onSubmit={handleSubmit}
              noValidate
              className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-2xl shadow-blue-200/60 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-slate-950/40 sm:p-10 lg:p-12"
            >
              <div className="pointer-events-none absolute -right-20 top-20 h-56 w-56 rounded-full bg-blue-100/70 blur-3xl dark:bg-blue-950/40" />
              <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 bg-[radial-gradient(circle,rgba(37,99,235,0.18)_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(circle,rgba(96,165,250,0.22)_1px,transparent_1px)]" />

              <div className="relative text-center">
                <div className="mx-auto mb-5 flex w-48 items-center justify-center">
                    <img src={logo} alt={t('auth.brandAlt')} className="w-auto object-contain" />
                </div>

                <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400 sm:text-base">
                  {authMode === 'register'
                    ? t('auth.fillForm')
                    : t('auth.signIn')}
                </p>
              </div>

              <div className="relative mt-8 space-y-4">
                {authMode === 'register' && (
                  <label className="block">
                    <span className="sr-only">{t('auth.yourName')}</span>
                    <span className={`flex items-center gap-3 rounded-2xl border bg-white/80 px-4 py-3.5 shadow-sm transition focus-within:ring-4 ${
                      fieldErrors.name
                        ? 'border-rose-300 focus-within:border-rose-500 focus-within:ring-rose-100'
                        : 'border-slate-200 focus-within:border-blue-500 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-950/70 dark:focus-within:border-sky-400 dark:focus-within:ring-sky-500/20'
                    }`}>
                      <User className="h-5 w-5 text-slate-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          clearFieldError('name');
                        }}
                        placeholder={t('auth.yourName')}
                        aria-invalid={Boolean(fieldErrors.name)}
                        className="auth-input w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                      />
                    </span>
                    {fieldErrors.name && (
                      <span className="mt-2 block text-xs font-semibold text-rose-600">
                        {fieldErrors.name}
                      </span>
                    )}
                  </label>
                )}

                <label className="block">
                  <span className="sr-only">{t('auth.email')}</span>
                  <span className={`flex items-center gap-3 rounded-2xl border bg-white/80 px-4 py-3.5 shadow-sm transition focus-within:ring-4 ${
                    fieldErrors.email
                      ? 'border-rose-300 focus-within:border-rose-500 focus-within:ring-rose-100'
                      : 'border-slate-200 focus-within:border-blue-500 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-950/70 dark:focus-within:border-sky-400 dark:focus-within:ring-sky-500/20'
                  }`}>
                    <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearFieldError('email');
                      }}
                      placeholder={t('auth.email')}
                      aria-invalid={Boolean(fieldErrors.email)}
                      className="auth-input w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                  </span>
                  {fieldErrors.email && (
                    <span className="mt-2 block text-xs font-semibold text-rose-600">
                      {fieldErrors.email}
                    </span>
                  )}
                </label>

                <label className="block">
                  <span className="sr-only">{t('auth.password')}</span>
                  <span className={`flex items-center gap-3 rounded-2xl border bg-white/80 px-4 py-3.5 shadow-sm transition focus-within:ring-4 ${
                    fieldErrors.password
                      ? 'border-rose-300 focus-within:border-rose-500 focus-within:ring-rose-100'
                      : 'border-slate-200 focus-within:border-blue-500 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-950/70 dark:focus-within:border-sky-400 dark:focus-within:ring-sky-500/20'
                  }`}>
                    <KeyRound className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearFieldError('password');
                      }}
                      placeholder={t('auth.password')}
                      aria-invalid={Boolean(fieldErrors.password)}
                      className="auth-input w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                      aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </span>
                  {fieldErrors.password && (
                    <span className="mt-2 block text-xs font-semibold text-rose-600">
                      {fieldErrors.password}
                    </span>
                  )}
                </label>

                {authMode === 'register' && (
                  <label className="block">
                    <span className="sr-only">{t('auth.confirmPassword')}</span>
                    <span className={`flex items-center gap-3 rounded-2xl border bg-white/80 px-4 py-3.5 shadow-sm transition focus-within:ring-4 ${
                      fieldErrors.confirmPassword
                        ? 'border-rose-300 focus-within:border-rose-500 focus-within:ring-rose-100'
                        : 'border-slate-200 focus-within:border-blue-500 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-950/70 dark:focus-within:border-sky-400 dark:focus-within:ring-sky-500/20'
                    }`}>
                      <KeyRound className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          clearFieldError('confirmPassword');
                        }}
                        placeholder={t('auth.confirmPassword')}
                        aria-invalid={Boolean(fieldErrors.confirmPassword)}
                        className="auth-input w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(prev => !prev)}
                        className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                        aria-label={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </span>
                    {fieldErrors.confirmPassword && (
                      <span className="mt-2 block text-xs font-semibold text-rose-600">
                        {fieldErrors.confirmPassword}
                      </span>
                    )}
                  </label>
                )}
              </div>

              {authMode === 'login' ? (
                <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <label className="flex cursor-pointer items-center gap-2 font-semibold text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    {t('auth.rememberMe')}
                  </label>
                  <button type="button" className="font-bold text-blue-600 hover:text-blue-700 dark:text-sky-400 dark:hover:text-sky-300">
                    {t('auth.forgotPassword')}
                  </button>
                </div>
              ) : (
                <>
                  <label className="relative mt-5 flex cursor-pointer items-start gap-3 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => {
                        setAcceptedTerms(e.target.checked);
                        clearFieldError('terms');
                      }}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      {t('auth.acceptTerms')} <button type="button" className="font-bold text-blue-600 dark:text-sky-400">{t('auth.termsOfUse')}</button> {t('auth.and')}{' '}
                      <button type="button" className="font-bold text-blue-600 dark:text-sky-400">{t('auth.privacyPolicy')}</button>
                    </span>
                  </label>
                  {fieldErrors.terms && (
                    <span className="-mt-2 block text-xs font-semibold text-rose-600">
                      {fieldErrors.terms}
                    </span>
                  )}
                </>
              )}

              {(localError || backendError) && (
                <div className="relative mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                  {localError || backendError}
                </div>
              )}

              <button
                type="submit"
                disabled={backendStatus === 'loading'}
                className="relative mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-700 px-5 py-4 text-base font-black text-white shadow-xl shadow-blue-500/25 transition hover:from-sky-400 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {backendStatus === 'loading'
                  ? t('auth.connecting')
                  : authMode === 'register'
                    ? t('auth.createAccount')
                    : t('auth.login')}
                <ArrowRight className="h-5 w-5" />
              </button>

              <div className="relative my-7 flex items-center gap-5 text-sm font-medium text-slate-400">
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                <span>{authMode === 'register' ? t('auth.or') : t('auth.orSignInWith')}</span>
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>

              {authMode === 'login' && (
                <div className="relative grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={startGoogleLogin}
                    disabled={googleLoading || backendStatus === 'loading'}
                    className="inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-200 dark:hover:border-sky-400 dark:hover:bg-slate-900"
                  >
                    <img src={googleIcon} alt="" aria-hidden="true" className="h-5 w-5 object-contain" />
                    <span>{googleLoading ? t('auth.googleConnecting') : t('auth.google')}</span>
                  </button>
                </div>
              )}

              <div className="relative mt-7 text-center text-sm font-semibold text-slate-500">
                <span className="text-slate-500 dark:text-slate-400">
                  {authMode === 'register' ? t('auth.alreadyHaveAccount') : t('auth.noAccount')}{' '}
                </span>
                <button
                  type="button"
                  onClick={() => switchMode(authMode === 'register' ? 'login' : 'register')}
                  className="font-black text-blue-600 hover:text-blue-700 dark:text-sky-400 dark:hover:text-sky-300"
                >
                  {authMode === 'register' ? t('auth.signInLink') : t('auth.signUp')}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};
