import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'

export function useAdminShortcut() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        const store = useAppStore.getState()
        const newMode = store.activeMode === 'Admin' ? 'AR' : 'Admin'
        store.setActiveMode(newMode)
        store.setShowRight(true)
        navigate(`/${newMode}`)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])
}
