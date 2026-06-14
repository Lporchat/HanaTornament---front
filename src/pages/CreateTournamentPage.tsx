import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export function CreateTournamentPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [form, setForm] = useState({ name: '', game: 'pokemon', entryFee: '', startDate: '' })
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
      const { data } = await api.post('/tournaments', {
        name: form.name,
        game: form.game,
        entryFee: form.entryFee ? Number(form.entryFee) : 0,
        startDate: form.startDate || null,
      })
      navigate(`/tournaments/${data.tournament.id}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar torneio.')
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== 'store') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-8">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <Trophy className="w-8 h-8 text-[var(--color-primary)]" />
            </div>
            <CardTitle className="text-xl">Apenas lojas podem criar torneios</CardTitle>
            <CardDescription>Crie uma conta de loja para organizar seus próprios eventos</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/register-store">
              <Button className="w-full">Cadastrar minha loja</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Trophy className="w-8 h-8 text-[var(--color-primary)]" />
          </div>
          <CardTitle className="text-xl">Criar torneio</CardTitle>
          <CardDescription>Configure seu torneio e abra as inscrições quando estiver pronto</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Nome do torneio</label>
              <Input placeholder="Liga Pokémon - Junho" {...field('name')} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Jogo</label>
              <select
                className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
                value={form.game}
                onChange={(e) => setForm((f) => ({ ...f, game: e.target.value }))}
              >
                <option value="pokemon">Pokémon</option>
                <option value="magic">Magic</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Taxa de inscrição (R$)</label>
                <Input type="number" min="0" step="0.01" placeholder="0,00" {...field('entryFee')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Data de início</label>
                <Input type="date" {...field('startDate')} />
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Criando...' : 'Criar torneio'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
