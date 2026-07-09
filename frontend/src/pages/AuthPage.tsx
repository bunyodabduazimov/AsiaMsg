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

type Props = {
  backendStatus: 'idle' | 'loading' | 'connected' | 'error';
  backendError: string | null;
  onLogin: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  onGoogleLogin: (idToken: string) => Promise<void>;
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
  const hiddenGoogleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleInitializedRef = useRef(false);
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
  const [googleLoading, setGoogleLoading] = useState(false);

  const switchMode = (mode: AuthMode) => {
    onClearError();
    setLocalError(null);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setAcceptedTerms(false);
    setAuthMode(mode);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    onClearError();
    setLocalError(null);

    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      setLocalError(t('auth.errors.enterEmailAndPassword'));
      return;
    }

    if (authMode === 'register') {
      if (!acceptedTerms) {
        setLocalError(t('auth.errors.acceptTermsRequired'));
        return;
      }

      if (normalizedPassword.length < 8) {
        setLocalError(t('auth.errors.passwordMinLength'));
        return;
      }

      if (normalizedPassword !== confirmPassword.trim()) {
        setLocalError(t('auth.errors.passwordsDoNotMatch'));
        return;
      }

      await onRegister({
        name: name.trim() || t('auth.defaultName'),
        email: normalizedEmail,
        password: normalizedPassword,
      });
      return;
    }

    await onLogin(normalizedEmail, normalizedPassword, rememberMe);
  };

  useEffect(() => {
    let cancelled = false;

    const renderGoogleButton = async () => {
      onClearError();
      setLocalError(null);

      if (authMode !== 'login') {
        googleInitializedRef.current = false;
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
        if (googleInitializedRef.current) {
          setGoogleLoading(false);
          return;
        }

        const googleApi = (window as any).google;
        if (!googleApi?.accounts?.id) {
          throw new Error(t('auth.errors.googleUnavailable'));
        }

        if (!hiddenGoogleButtonRef.current) {
          return;
        }

        googleApi.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: { credential?: string }) => {
            if (!response?.credential) {
              setLocalError(t('auth.errors.googleCredentialMissing'));
              return;
            }

            try {
              setGoogleLoading(true);
              await onGoogleLogin(response.credential);
            } catch (error) {
              setLocalError(error instanceof Error ? error.message : t('auth.errors.googleUnavailable'));
            } finally {
              setGoogleLoading(false);
            }
          },
          auto_select: true,
          cancel_on_tap_outside: true
        });
        googleInitializedRef.current = true;

        googleApi.accounts.id.renderButton(hiddenGoogleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          text: 'signin_with',
          shape: 'rectangular',
          width: hiddenGoogleButtonRef.current.clientWidth || 320
        });

        setGoogleLoading(false);
      } catch (error) {
        if (!cancelled) {
          setLocalError(error instanceof Error ? error.message : t('auth.errors.googleUnavailable'));
          setGoogleLoading(false);
        }
      }
    };

    void renderGoogleButton();

    return () => {
      cancelled = true;
    };
  }, [authMode, googleClientId, onClearError, onGoogleLogin, t]);

  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#f6faff] text-slate-950">
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_18%,rgba(37,99,235,0.16),transparent_28%),radial-gradient(circle_at_95%_80%,rgba(59,130,246,0.20),transparent_30%),linear-gradient(115deg,#ffffff_0%,#f8fbff_45%,#eaf4ff_100%)]" />
        <div className="absolute -left-28 bottom-0 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative mx-auto grid min-h-screen w-full max-w-3xl grid-cols-1 items-center px-5 py-8 sm:px-8 lg:px-12">
          <section className="mx-auto w-full max-w-2xl">
            <form
              onSubmit={handleSubmit}
              className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-2xl shadow-blue-200/60 backdrop-blur-xl sm:p-10 lg:p-12"
            >
              <div className="pointer-events-none absolute -right-20 top-20 h-56 w-56 rounded-full bg-blue-100/70 blur-3xl" />
              <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 bg-[radial-gradient(circle,rgba(37,99,235,0.18)_1px,transparent_1px)] [background-size:16px_16px]" />

              <div className="relative text-center">
                <div className="mx-auto mb-5 flex w-48 items-center justify-center">
                    <img src={logo} alt={t('auth.brandAlt')} className="w-auto object-contain" />
                </div>

                <p className="mt-3 text-sm font-medium text-slate-500 sm:text-base">
                  {authMode === 'register'
                    ? t('auth.fillForm')
                    : t('auth.signIn')}
                </p>
              </div>

              <div className="relative mt-8 space-y-4">
                {authMode === 'register' && (
                  <label className="block">
                    <span className="sr-only">{t('auth.yourName')}</span>
                    <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3.5 shadow-sm transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                      <User className="h-5 w-5 text-slate-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('auth.yourName')}
                        className="auth-input w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                      />
                    </span>
                  </label>
                )}

                <label className="block">
                  <span className="sr-only">{t('auth.email')}</span>
                  <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3.5 shadow-sm transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                    <Mail className="h-5 w-5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('auth.email')}
                      className="auth-input w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="sr-only">{t('auth.password')}</span>
                  <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3.5 shadow-sm transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                    <KeyRound className="h-5 w-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('auth.password')}
                      className="auth-input w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="text-slate-400 hover:text-slate-600"
                      aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </span>
                </label>

                {authMode === 'register' && (
                  <label className="block">
                    <span className="sr-only">{t('auth.confirmPassword')}</span>
                    <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3.5 shadow-sm transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                      <KeyRound className="h-5 w-5 text-slate-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('auth.confirmPassword')}
                        className="auth-input w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(prev => !prev)}
                        className="text-slate-400 hover:text-slate-600"
                        aria-label={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </span>
                  </label>
                )}
              </div>

              {authMode === 'login' ? (
                <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <label className="flex cursor-pointer items-center gap-2 font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    {t('auth.rememberMe')}
                  </label>
                  <button type="button" className="font-bold text-blue-600 hover:text-blue-700">
                    {t('auth.forgotPassword')}
                  </button>
                </div>
              ) : (
                <label className="relative mt-5 flex cursor-pointer items-start gap-3 text-sm font-medium leading-6 text-slate-600">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    {t('auth.acceptTerms')} <button type="button" className="font-bold text-blue-600">{t('auth.termsOfUse')}</button> {t('auth.and')}{' '}
                    <button type="button" className="font-bold text-blue-600">{t('auth.privacyPolicy')}</button>
                  </span>
                </label>
              )}

              {(localError || backendError) && (
                <div className="relative mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-5 text-amber-900">
                  {localError || backendError}
                </div>
              )}

              <button
                type="submit"
                disabled={backendStatus === 'loading' || (authMode === 'register' && !acceptedTerms)}
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
                <span className="h-px flex-1 bg-slate-200" />
                <span>{authMode === 'register' ? t('auth.or') : t('auth.orSignInWith')}</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              {authMode === 'login' && (
                <div className="relative grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (googleLoading) return;
                      const button = hiddenGoogleButtonRef.current?.querySelector('button');
                      button?.click();
                    }}
                    disabled={googleLoading || backendStatus === 'loading'}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <img src={googleIcon} alt="Google" className="h-5 w-5 object-contain" />
                    {googleLoading ? t('auth.googleConnecting') : t('auth.google')}
                  </button>
                  <div
                    ref={hiddenGoogleButtonRef}
                    className="pointer-events-none absolute left-0 top-0 h-0 w-0 overflow-hidden opacity-0"
                    aria-hidden="true"
                  />
                </div>
              )}

              <div className="relative mt-7 text-center text-sm font-semibold text-slate-500">
                {authMode === 'register' ? t('auth.alreadyHaveAccount') : t('auth.noAccount')}{' '}
                <button
                  type="button"
                  onClick={() => switchMode(authMode === 'register' ? 'login' : 'register')}
                  className="font-black text-blue-600 hover:text-blue-700"
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
