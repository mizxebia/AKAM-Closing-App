import './App.css'
import { useEffect } from 'react'
import { ClosingTicketPage } from './features/closingTickets'
import { prefetchBuildings } from './features/closingTickets/data/buildingListCache'
import { ToastContainer } from './components/feedback/ToastContainer'

function App() {
  useEffect(() => {
    // Fetch the full SharePoint building list once at startup and cache it.
    prefetchBuildings()
  }, [])

  return (
    <>
      <ClosingTicketPage />
      <ToastContainer />
    </>
  )
}

export default App
