import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Trophy, Users, Calendar, Swords, Award, ChevronDown, ChevronUp,
  CheckCircle, Clock, AlertCircle, Settings,
} from 'lucide-react'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho', open: 'Inscrições abertas', in_progress: 'Em andamento', finished: 'Finalizado',
}
const STATUS_VARIANT: Record<string, any> = {
  draft: 'outline', open: 'success', in_progress: 'warning', finished: 'outline',
}

function StandingsTable({ tournamentId, prizes, prizePool }: { tournamentId: string, prizes?: any[], prizePool?: number }) {
  const { data } = useQuery({
    queryKey: ['standings', tournamentId],
    queryFn: () => api.get(`/tournaments/${tournamentId}/rounds/standings`).then((r) => r.data.standings),
    refetchInterval: 10000,
  })

  if (!data?.length) return (
    <p className="text-sm text-[var(--color-text-muted)] text-center py-4">Nenhuma rodada finalizada ainda.</p>
  )

  const prizeByPosition = new Map<number, number>(
    (prizes ?? []).map((p: any) => [p.position, (p.percentage / 100) * (prizePool ?? 0)])
  )
  const hasPrizes = prizeByPosition.size > 0

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
            <th className="text-left py-2 pr-4">#</th>
            <th className="text-left py-2 pr-4">Jogador</th>
            <th className="text-center py-2 pr-4">V</th>
            <th className="text-center py-2 pr-4">E</th>
            <th className="text-center py-2 pr-4">D</th>
            <th className="text-center py-2 pr-4">Pts</th>
            <th className="text-center py-2 pr-4">OMW%</th>
            {hasPrizes && <th className="text-right py-2">Premiação</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((player: any, i: number) => {
            const prize = prizeByPosition.get(player.position)
            return (
              <tr key={player.userId} className={`border-b border-[var(--color-border)] ${i < 4 ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}>
                <td className="py-2.5 pr-4 font-bold">{player.position}</td>
                <td className="py-2.5 pr-4 font-medium">{player.fullName}</td>
                <td className="text-center py-2.5 pr-4 text-green-400">{player.wins}</td>
                <td className="text-center py-2.5 pr-4 text-yellow-400">{player.draws ?? 0}</td>
                <td className="text-center py-2.5 pr-4 text-red-400">{player.losses}</td>
                <td className="text-center py-2.5 pr-4 font-bold text-[var(--color-primary)]">{player.points}</td>
                <td className="text-center py-2.5 pr-4 text-[var(--color-text-muted)]">{player.omw}%</td>
                {hasPrizes && (
                  <td className="text-right py-2.5 font-semibold text-yellow-400">
                    {prize ? formatCurrency(prize) : '—'}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function RoundsList({ tournamentId, isOrganizer, tournamentStatus, swissRounds }: {
  tournamentId: string
  isOrganizer: boolean
  tournamentStatus: string
  swissRounds?: number
}) {
  const [openRound, setOpenRound] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: rounds } = useQuery({
    queryKey: ['rounds', tournamentId],
    queryFn: () => api.get(`/tournaments/${tournamentId}/rounds`).then((r) => r.data.rounds),
    refetchInterval: 10000,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['rounds', tournamentId] })
    queryClient.invalidateQueries({ queryKey: ['standings', tournamentId] })
    queryClient.refetchQueries({ queryKey: ['tournament', tournamentId] })
  }

  const createRoundMutation = useMutation({
    mutationFn: () => api.post(`/tournaments/${tournamentId}/rounds`),
    onSuccess: invalidate,
  })

  const finishRoundMutation = useMutation({
    mutationFn: (roundId: string) => api.patch(`/tournaments/${tournamentId}/rounds/${roundId}/finish`),
    onSuccess: invalidate,
  })

  const reportResultMutation = useMutation({
    mutationFn: ({ roundId, matchId, winnerId, isDraw }: { roundId: string, matchId: string, winnerId?: string, isDraw?: boolean }) =>
      api.patch(`/tournaments/${tournamentId}/rounds/${roundId}/matches/${matchId}/result`, { winnerId, isDraw }),
    onSuccess: invalidate,
  })

  const lastRound = rounds?.[rounds.length - 1]
  const canCreateRound = isOrganizer && tournamentStatus === 'in_progress'
    && (!rounds?.length || lastRound?.status === 'finished')
    && (!swissRounds || (rounds?.length ?? 0) < swissRounds)

  return (
    <div className="flex flex-col gap-3">
      {canCreateRound && (
        <div className="flex flex-wrap items-end gap-2">
          <Button onClick={() => createRoundMutation.mutate()} disabled={createRoundMutation.isPending}>
            {createRoundMutation.isPending ? 'Gerando...' : 'Gerar próxima rodada'}
          </Button>
        </div>
      )}
      {createRoundMutation.isError && (
        <p className="text-xs text-red-400">{(createRoundMutation.error as any)?.response?.data?.message}</p>
      )}

      {!rounds?.length ? (
        <p className="text-sm text-[var(--color-text-muted)] text-center py-4">Nenhuma rodada iniciada ainda.</p>
      ) : (
        rounds.map((round: any) => {
          const pendingMatches = round.matches?.filter((m: any) => !m.isBye && m.status !== 'finished') ?? []
          const canFinishRound = isOrganizer && round.status !== 'finished' && pendingMatches.length === 0

          return (
            <div key={round.id} className="border border-[var(--color-border)] rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] transition-colors"
                onClick={() => setOpenRound(openRound === round.id ? null : round.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">Rodada {round.roundNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={round.status === 'finished' ? 'success' : 'warning'}>
                    {round.status === 'finished' ? 'Finalizada' : 'Em andamento'}
                  </Badge>
                  {openRound === round.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>
              {openRound === round.id && (
                <div className="divide-y divide-[var(--color-border)]">
                  {round.matches?.map((match: any) => (
                    <div key={match.id} className="px-4 py-3 flex flex-col gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        {match.isBye ? (
                          <span className="text-[var(--color-text-muted)]">{match.player1?.fullName ?? '—'} — BYE (vitória automática)</span>
                        ) : (
                          <>
                            <span className={match.winnerId === match.player1Id ? 'font-bold text-green-400' : match.isDraw ? 'font-medium text-yellow-400' : 'text-[var(--color-text-muted)]'}>
                              {match.player1?.fullName ?? '—'}
                            </span>
                            <span className="text-[var(--color-text-muted)] mx-3">
                              {match.isDraw ? 'empate' : 'vs'}
                            </span>
                            <span className={match.winnerId === match.player2Id ? 'font-bold text-green-400' : match.isDraw ? 'font-medium text-yellow-400' : 'text-[var(--color-text-muted)]'}>
                              {match.player2?.fullName ?? '—'}
                            </span>
                          </>
                        )}
                        <div className="ml-4">
                          {match.status === 'finished'
                            ? <CheckCircle className="w-4 h-4 text-green-400" />
                            : <Clock className="w-4 h-4 text-yellow-400" />}
                        </div>
                      </div>
                      {isOrganizer && !match.isBye && round.status !== 'finished' && (
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm" variant={match.winnerId === match.player1Id ? 'default' : 'outline'}
                            disabled={reportResultMutation.isPending}
                            onClick={() => reportResultMutation.mutate({ roundId: round.id, matchId: match.id, winnerId: match.player1Id })}
                          >
                            {match.player1?.fullName} venceu
                          </Button>
                          <Button
                            size="sm" variant={match.winnerId === match.player2Id ? 'default' : 'outline'}
                            disabled={reportResultMutation.isPending}
                            onClick={() => reportResultMutation.mutate({ roundId: round.id, matchId: match.id, winnerId: match.player2Id })}
                          >
                            {match.player2?.fullName} venceu
                          </Button>
                          <Button
                            size="sm" variant={match.isDraw ? 'default' : 'outline'}
                            disabled={reportResultMutation.isPending}
                            onClick={() => reportResultMutation.mutate({ roundId: round.id, matchId: match.id, isDraw: true })}
                          >
                            Empate
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {canFinishRound && (
                    <div className="px-4 py-3">
                      <Button size="sm" onClick={() => finishRoundMutation.mutate(round.id)} disabled={finishRoundMutation.isPending}>
                        {finishRoundMutation.isPending ? 'Finalizando...' : 'Finalizar rodada'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

function PrizeTable({ prizes, entryFee, enrolledCount }: { prizes: any[], entryFee: number, enrolledCount: number }) {
  if (!prizes?.length) return null

  const prizePool = entryFee * enrolledCount

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-[var(--color-text-muted)]">
        Pool total: <span className="font-bold text-[var(--color-text)]">{formatCurrency(prizePool)}</span>
        {' '}({enrolledCount} jogadores × {formatCurrency(entryFee)})
      </p>
      <div className="space-y-1.5">
        {prizes.map((prize: any) => (
          <div key={prize.id} className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-muted)]">{prize.position}º lugar</span>
            <div className="flex items-center gap-3">
              <span className="text-[var(--color-text-muted)]">{prize.percentage}%</span>
              <span className="font-semibold text-[var(--color-primary)]">
                {formatCurrency((prize.percentage / 100) * prizePool)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated, user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => api.get(`/tournaments/${id}`).then((r) => r.data.tournament),
    refetchInterval: 15000,
  })

  const invalidateTournament = () => queryClient.invalidateQueries({ queryKey: ['tournament', id] })

  const enrollMutation = useMutation({
    mutationFn: () => api.post(`/tournaments/${id}/enrollments`),
    onSuccess: invalidateTournament,
  })

  const cancelMutation = useMutation({
    mutationFn: () => api.delete(`/tournaments/${id}/enrollments`),
    onSuccess: invalidateTournament,
  })

  const openEnrollmentMutation = useMutation({
    mutationFn: () => api.patch(`/tournaments/${id}/open`),
    onSuccess: invalidateTournament,
  })

  const startMutation = useMutation({
    mutationFn: () => api.patch(`/tournaments/${id}/start`),
    onSuccess: invalidateTournament,
  })

  const validatePaymentMutation = useMutation({
    mutationFn: (userId: string) => api.patch(`/tournaments/${id}/enrollments/${userId}/validate`),
    onSuccess: invalidateTournament,
  })

  if (isLoading) return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => <div key={i} className="h-32 rounded-xl bg-[var(--color-surface)] animate-pulse" />)}
    </div>
  )

  if (!data) return (
    <div className="text-center py-16 text-[var(--color-text-muted)]">
      <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p>Torneio não encontrado.</p>
    </div>
  )

  const confirmedEnrollments = data.enrollments?.filter((e: any) => e.paymentValidated) ?? []
  const myEnrollment = data.enrollments?.find((e: any) => e.player?.id === user?.id || e.userId === user?.id)
  const canEnroll = isAuthenticated && data.status === 'open' && !myEnrollment
  const canCancel = isAuthenticated && data.status === 'open' && myEnrollment
  const prizePool = (data.entryFee ?? 0) * confirmedEnrollments.length
  const isOrganizer = isAuthenticated && data.organization?.ownerId === user?.id

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={data.game as 'pokemon' | 'magic'}>
              {data.game === 'pokemon' ? 'Pokémon' : 'Magic'}
            </Badge>
            <Badge variant={STATUS_VARIANT[data.status]}>{STATUS_LABEL[data.status]}</Badge>
            {isOrganizer && <Badge variant="outline">Você é o organizador</Badge>}
          </div>
          <h1 className="text-3xl font-bold">{data.name}</h1>
          <p className="text-[var(--color-text-muted)]">{data.organization?.name}</p>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {data.entryFee > 0 && (
            <span className="text-2xl font-bold text-[var(--color-primary)]">
              {formatCurrency(data.entryFee)}
            </span>
          )}
          {canEnroll && (
            <Button onClick={() => enrollMutation.mutate()} disabled={enrollMutation.isPending}>
              {enrollMutation.isPending ? 'Inscrevendo...' : 'Inscrever-se'}
            </Button>
          )}
          {canCancel && (
            <div className="flex flex-col items-end gap-1">
              <Badge variant="success">Inscrito</Badge>
              {!myEnrollment?.paymentValidated && (
                <Badge variant="warning">Pagamento pendente</Badge>
              )}
              <Button variant="outline" size="sm" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
                Cancelar inscrição
              </Button>
            </div>
          )}
          {enrollMutation.isError && (
            <p className="text-xs text-red-400">{(enrollMutation.error as any)?.response?.data?.message}</p>
          )}
        </div>
      </div>

      {/* Painel do organizador */}
      {isOrganizer && (data.status === 'draft' || data.status === 'open') && (
        <Card className="border-[var(--color-primary)]/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-[var(--color-primary)]" />
              Painel do organizador
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.status === 'draft' && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-[var(--color-text-muted)]">
                  O torneio está em rascunho. Abra as inscrições para que jogadores possam se inscrever.
                </p>
                <Button onClick={() => openEnrollmentMutation.mutate()} disabled={openEnrollmentMutation.isPending} className="self-start">
                  {openEnrollmentMutation.isPending ? 'Abrindo...' : 'Abrir inscrições'}
                </Button>
                {openEnrollmentMutation.isError && (
                  <p className="text-xs text-red-400">{(openEnrollmentMutation.error as any)?.response?.data?.message}</p>
                )}
              </div>
            )}

            {data.status === 'open' && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-[var(--color-text-muted)]">
                  Valide o pagamento dos jogadores inscritos. É necessário no mínimo 4 confirmados para iniciar.
                </p>
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {data.enrollments?.map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between text-sm border-b border-[var(--color-border)] pb-2 last:border-0 last:pb-0">
                      <span>{e.player?.fullName}</span>
                      {e.paymentValidated ? (
                        <Badge variant="success">Confirmado</Badge>
                      ) : (
                        <Button
                          size="sm" variant="outline"
                          disabled={validatePaymentMutation.isPending}
                          onClick={() => validatePaymentMutation.mutate(e.player?.id ?? e.userId)}
                        >
                          Validar pagamento
                        </Button>
                      )}
                    </div>
                  ))}
                  {!data.enrollments?.length && (
                    <p className="text-sm text-[var(--color-text-muted)]">Nenhum inscrito ainda.</p>
                  )}
                </div>
                <Button
                  onClick={() => startMutation.mutate()}
                  disabled={startMutation.isPending || confirmedEnrollments.length < 4}
                  className="self-start"
                >
                  {startMutation.isPending ? 'Iniciando...' : `Iniciar torneio (${confirmedEnrollments.length}/4 confirmados)`}
                </Button>
                {startMutation.isError && (
                  <p className="text-xs text-red-400">{(startMutation.error as any)?.response?.data?.message}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <CardContent className="p-0 flex flex-col gap-1">
            <p className="text-xs text-[var(--color-text-muted)]">Inscritos</p>
            <p className="text-xl font-bold flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[var(--color-primary)]" />
              {data.enrollments?.length ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card className="p-4">
          <CardContent className="p-0 flex flex-col gap-1">
            <p className="text-xs text-[var(--color-text-muted)]">Confirmados</p>
            <p className="text-xl font-bold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-400" />
              {confirmedEnrollments.length}
            </p>
          </CardContent>
        </Card>
        {data.swissRounds && (
          <Card className="p-4">
            <CardContent className="p-0 flex flex-col gap-1">
              <p className="text-xs text-[var(--color-text-muted)]">Rodadas Swiss</p>
              <p className="text-xl font-bold flex items-center gap-1.5">
                <Swords className="w-4 h-4 text-[var(--color-primary)]" />
                {data.swissRounds}
              </p>
            </CardContent>
          </Card>
        )}
        {prizePool > 0 && (
          <Card className="p-4">
            <CardContent className="p-0 flex flex-col gap-1">
              <p className="text-xs text-[var(--color-text-muted)]">Pool de prêmios</p>
              <p className="text-xl font-bold flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-yellow-400" />
                {formatCurrency(prizePool)}
              </p>
            </CardContent>
          </Card>
        )}
        {data.startDate && (
          <Card className="p-4">
            <CardContent className="p-0 flex flex-col gap-1">
              <p className="text-xs text-[var(--color-text-muted)]">Data</p>
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
                {formatDate(data.startDate)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Standings + Rounds */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {(data.status === 'in_progress' || data.status === 'finished') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  Classificação atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StandingsTable tournamentId={id!} prizes={data.prizeDistribution} prizePool={prizePool} />
              </CardContent>
            </Card>
          )}

          {(data.status === 'in_progress' || data.status === 'finished') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Swords className="w-4 h-4 text-[var(--color-primary)]" />
                  Rodadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RoundsList
                  tournamentId={id!}
                  isOrganizer={isOrganizer}
                  tournamentStatus={data.status}
                  swissRounds={data.swissRounds}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {data.prizeDistribution?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-400" />
                  Premiação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PrizeTable
                  prizes={data.prizeDistribution}
                  entryFee={data.entryFee}
                  enrolledCount={confirmedEnrollments.length}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--color-primary)]" />
                Jogadores ({data.enrollments?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
                {data.enrollments?.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between text-sm">
                    <span>{e.player?.fullName}</span>
                    {e.paymentValidated
                      ? <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                      : <Clock className="w-3.5 h-3.5 text-yellow-400" />}
                  </div>
                ))}
                {!data.enrollments?.length && (
                  <p className="text-sm text-[var(--color-text-muted)]">Nenhum inscrito ainda.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
