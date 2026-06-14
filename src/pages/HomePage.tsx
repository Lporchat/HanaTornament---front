import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Trophy, Swords, ArrowRight } from 'lucide-react'
import { api } from '@/services/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'

export function HomePage() {
  const { data: open } = useQuery({
    queryKey: ['tournaments', 'open'],
    queryFn: () => api.get('/tournaments', { params: { status: 'open' } }).then((r) => r.data.tournaments),
  })

  const { data: inProgress } = useQuery({
    queryKey: ['tournaments', 'in_progress'],
    queryFn: () => api.get('/tournaments', { params: { status: 'in_progress' } }).then((r) => r.data.tournaments),
  })

  return (
    <div className="flex flex-col gap-10">
      {/* Hero */}
      <div className="text-center py-12 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary)]/20 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-[var(--color-primary)]" />
        </div>
        <h1 className="text-4xl font-bold">HanaTournament</h1>
        <p className="text-[var(--color-text-muted)] max-w-md">
          Plataforma de torneios de TCG. Pokémon e Magic: The Gathering.
        </p>
        <Link to="/tournaments">
          <Button size="lg">
            Ver todos os torneios
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Inscrições abertas */}
      {!!open?.length && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Inscrições abertas</h2>
            <Link to="/tournaments?status=open">
              <Button variant="ghost" size="sm">Ver todos <ArrowRight className="w-3.5 h-3.5" /></Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {open.slice(0, 3).map((t: any) => (
              <Link key={t.id} to={`/tournaments/${t.id}`}>
                <Card className="hover:border-[var(--color-primary)] transition-colors cursor-pointer">
                  <CardContent className="p-0 flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <span className="font-semibold">{t.name}</span>
                      <Badge variant={t.game}>{t.game === 'pokemon' ? 'Pokémon' : 'Magic'}</Badge>
                    </div>
                    <p className="text-sm text-[var(--color-text-muted)]">{t.organization?.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      {t.startDate && <span className="text-xs text-[var(--color-text-muted)]">{formatDate(t.startDate)}</span>}
                      <span className="text-sm font-bold text-[var(--color-primary)] ml-auto">
                        {t.entryFee > 0 ? formatCurrency(t.entryFee) : 'Gratuito'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Em andamento */}
      {!!inProgress?.length && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Swords className="w-4 h-4 text-[var(--color-primary)]" />
              Em andamento
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgress.slice(0, 3).map((t: any) => (
              <Link key={t.id} to={`/tournaments/${t.id}`}>
                <Card className="hover:border-[var(--color-primary)] transition-colors cursor-pointer border-yellow-500/30">
                  <CardContent className="p-0 flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <span className="font-semibold">{t.name}</span>
                      <Badge variant="warning">Ao vivo</Badge>
                    </div>
                    <p className="text-sm text-[var(--color-text-muted)]">{t.organization?.name}</p>
                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                      <span>{t.enrollments?.length ?? 0} jogadores</span>
                      {t.swissRounds && <span>· {t.swissRounds} rodadas</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
