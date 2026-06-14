import { useQuery } from '@tanstack/react-query'
import { Wallet, TrendingUp, TrendingDown, Settings } from 'lucide-react'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'

const TX_ICON: Record<string, React.ReactNode> = {
  earned: <TrendingUp className="w-4 h-4 text-green-400" />,
  spent: <TrendingDown className="w-4 h-4 text-red-400" />,
  adjusted: <Settings className="w-4 h-4 text-yellow-400" />,
}
const TX_VARIANT: Record<string, any> = { earned: 'success', spent: 'destructive', adjusted: 'warning' }
const TX_LABEL: Record<string, string> = { earned: 'Ganho', spent: 'Gasto', adjusted: 'Ajuste' }

export function WalletPage() {
  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.get('/wallet/me').then((r) => r.data),
  })

  const { data: txData } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => api.get('/wallet/me/transactions').then((r) => r.data),
  })

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Minha Carteira</h1>

      <Card className="bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-surface)]">
        <CardContent className="p-0 flex flex-col gap-1">
          <p className="text-sm text-[var(--color-text-muted)]">Saldo disponível</p>
          <p className="text-4xl font-bold flex items-center gap-2">
            <Wallet className="w-7 h-7 text-[var(--color-primary)]" />
            {formatCurrency(wallet?.balance ?? 0)}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">Crédito em loja · use na compra de produtos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Extrato</CardTitle>
        </CardHeader>
        <CardContent>
          {!txData?.transactions?.length ? (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-4">Nenhuma transação ainda.</p>
          ) : (
            <div className="flex flex-col divide-y divide-[var(--color-border)]">
              {txData.transactions.map((tx: any) => (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {TX_ICON[tx.type]}
                    <div>
                      <p className="text-sm font-medium">{tx.description || '—'}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{formatDateTime(tx.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={TX_VARIANT[tx.type]}>{TX_LABEL[tx.type]}</Badge>
                    <span className={`font-bold text-sm ${tx.type === 'spent' ? 'text-red-400' : tx.amount > 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {tx.type === 'spent' ? '-' : tx.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
