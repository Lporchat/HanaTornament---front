import { Link, useNavigate } from 'react-router-dom'
import { Trophy, Wallet, User, LogOut, LogIn } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <Trophy className="w-5 h-5 text-[var(--color-primary)]" />
          <span>HanaTournament</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link to="/tournaments">
            <Button variant="ghost" size="sm">Torneios</Button>
          </Link>

          {isAuthenticated ? (
            <>
              {user?.role === 'player' && (
                <Link to="/wallet">
                  <Button variant="ghost" size="sm">
                    <Wallet className="w-4 h-4" />
                    Carteira
                  </Button>
                </Link>
              )}
              <Link to="/profile">
                <Button variant="ghost" size="sm">
                  <User className="w-4 h-4" />
                  {user?.fullName.split(' ')[0]}
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button size="sm">
                <LogIn className="w-4 h-4" />
                Entrar
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
