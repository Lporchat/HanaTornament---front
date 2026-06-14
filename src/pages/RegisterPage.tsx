import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ fullName: '', cpf: '', birthDate: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', form)
      setAuth(data.user, data.token)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao cadastrar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Trophy className="w-8 h-8 text-[var(--color-primary)]" />
          </div>
          <CardTitle className="text-xl">Criar conta</CardTitle>
          <CardDescription>Junte-se à comunidade HanaTournament</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Nome completo</label>
              <Input placeholder="João da Silva" {...field('fullName')} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">CPF</label>
                <Input placeholder="000.000.000-00" {...field('cpf')} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Data de nascimento</label>
                <Input type="date" {...field('birthDate')} required />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">E-mail</label>
              <Input type="email" placeholder="seu@email.com" {...field('email')} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Senha</label>
              <Input type="password" placeholder="••••••••" {...field('password')} required />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Cadastrando...' : 'Criar conta'}
            </Button>
            <p className="text-center text-sm text-[var(--color-text-muted)]">
              Já tem conta?{' '}
              <Link to="/login" className="text-[var(--color-primary)] hover:underline">
                Entrar
              </Link>
            </p>
            <p className="text-center text-sm text-[var(--color-text-muted)]">
              É uma loja e quer organizar torneios?{' '}
              <Link to="/register-store" className="text-[var(--color-primary)] hover:underline">
                Cadastro de loja
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
