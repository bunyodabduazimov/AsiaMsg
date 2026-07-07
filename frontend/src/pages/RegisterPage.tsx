import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { AuthLayout } from '@/layouts/AuthLayout';
import { useAuth } from '@/features/auth/AuthContext';

export const RegisterPage = () => {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await register(name, email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать аккаунт');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="mx-auto w-full max-w-[420px] border-white/10 bg-white/6 p-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Регистрация</p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Имя</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ваше имя" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Email</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Пароль</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Создаём...' : 'Создать аккаунт'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Уже есть аккаунт?{' '}
          <Link className="text-mint-400 hover:text-mint-300" to="/login">
            Войти
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
};
