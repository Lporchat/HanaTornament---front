import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Calendar, Users, Trophy, Search } from 'lucide-react'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho', open: 'Inscrições abertas', in_progress: 'Em andamento', finished: 'Finalizado',
}
const STATUS_VARIANT: Record<string, any> = {
  draft: 'outline', open: 'success', in_progress: 'warning', finished: 'outline',
}

export function TournamentsPage() {
  const [search, setSearch] = useState('')
  const [game, setGame] = useState<'all' | 'pokemon' | 'magic'>('all')
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['tournaments', game],
    queryFn: () => api.get('/tournaments', { params: game !== 'all' ? { game } : {} }).then((r) => r.data.tournaments),
  })

  const filtered = (data ?? []).filter((t: any) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Torneios</h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">Encontre e se inscreva nos próximos torneios</p>
        </div>
        {user?.role === 'store' && (
          <Link to="/tournaments/new">
            <Button>Criar torneio</Button>
          </Link>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-[var(--color-text-muted)]" />
          <Input
            placeholder="Buscar torneio..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pokemon', 'magic'] as const).map((g) => (
            <Button
              key={g}
              variant={game === g ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGame(g)}
            >
              {g === 'all' ? 'Todos' : g === 'pokemon' ? 'Pokémon' : 'Magic'}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-[var(--color-surface)] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-text-muted)]">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Nenhum torneio encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tournament: any) => (
            <Link key={tournament.id} to={`/tournaments/${tournament.id}`}>
              <Card className="hover:border-[var(--color-primary)] transition-colors cursor-pointer h-full">
                <CardContent className="flex flex-col gap-3 p-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{tournament.name}</h3>
                      <p className="text-sm text-[var(--color-text-muted)]">{tournament.organization?.name}</p>
                    </div>
                    <Badge variant={tournament.game as 'pokemon' | 'magic'}>
                      {tournament.game === 'pokemon' ? 'Pokémon' : 'Magic'}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1.5 text-sm text-[var(--color-text-muted)]">
                    {tournament.startDate && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(tournament.startDate)}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {tournament.enrollments?.length ?? 0} inscritos
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-[var(--color-border)]">
                    <Badge variant={STATUS_VARIANT[tournament.status]}>
                      {STATUS_LABEL[tournament.status]}
                    </Badge>
                    <span className="text-sm font-semibold text-[var(--color-primary)]">
                      {tournament.entryFee > 0 ? formatCurrency(tournament.entryFee) : 'Gratuito'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
