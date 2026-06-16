import './App.css'
import { useEffect } from 'react'
import { ClosingTicketPage } from './features/closingTickets'
import { prefetchBuildings } from './features/closingTickets/data/buildingListCache'

function App() {
  useEffect(() => {
    // Fetch the full SharePoint building list once at startup and cache it.
    prefetchBuildings()
  }, [])

  return <ClosingTicketPage />
}

export default App
