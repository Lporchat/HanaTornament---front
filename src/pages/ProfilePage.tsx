import { useQuery } from '@tanstack/react-query'
import { User, Swords, Trophy, Skull } from 'lucide-react'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function ProfilePage() {
  const { user } = useAuthStore()

  const isPlayer = user?.role === 'player'

  const { data: rivalries } = useQuery({
    queryKey: ['rivalries'],
    queryFn: () => api.get('/rivalries').then((r) => r.data),
    enabled: isPlayer,
  })

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center">
          <User className="w-7 h-7 text-[var(--color-primary)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user?.fullName}</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{user?.email}</p>
        </div>
      </div>

      {/* Nemesis / Bye */}
      {isPlayer && (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className={rivalries?.nemesis ? 'border-red-500/30' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Skull className="w-4 h-4 text-red-400" />
              Seu Nemesis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rivalries?.nemesis ? (
              <div className="flex flex-col gap-1">
                <p className="font-semibold">{rivalries.nemesis.opponent.fullName}</p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Vence você em <span className="text-red-400 font-bold">{rivalries.nemesis.opponentWinRate}%</span> dos confrontos
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {rivalries.nemesis.opponentWins}V × {rivalries.nemesis.myWins}D em {rivalries.nemesis.totalMatches} partidas
                </p>
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">Dispute pelo menos 3 confrontos com o mesmo jogador.</p>
            )}
          </CardContent>
        </Card>

        <Card className={rivalries?.bye ? 'border-green-500/30' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="w-4 h-4 text-green-400" />
              Seu Bye
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rivalries?.bye ? (
              <div className="flex flex-col gap-1">
                <p className="font-semibold">{rivalries.bye.opponent.fullName}</p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Você vence em <span className="text-green-400 font-bold">{rivalries.bye.myWinRate}%</span> dos confrontos
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {rivalries.bye.myWins}V × {rivalries.bye.opponentWins}D em {rivalries.bye.totalMatches} partidas
                </p>
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">Dispute pelo menos 3 confrontos com o mesmo jogador.</p>
            )}
          </CardContent>
        </Card>
      </div>
      )}

      {/* Todas as rivalidades */}
      {isPlayer && !!rivalries?.rivalries?.length && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-[var(--color-primary)]" />
              Confrontos head-to-head
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y divide-[var(--color-border)]">
              {rivalries.rivalries.map((r: any) => (
                <div key={r.opponent.id} className="py-3 flex items-center justify-between">
                  <span className="font-medium">{r.opponent.fullName}</span>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-green-400 font-semibold">{r.myWins}V</span>
                    <span className="text-[var(--color-text-muted)]">×</span>
                    <span className="text-red-400 font-semibold">{r.opponentWins}D</span>
                    <Badge variant={r.myWinRate >= 50 ? 'success' : 'destructive'}>
                      {r.myWinRate}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
