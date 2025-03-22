import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuth, AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import OfferForm from './pages/offers/OfferForm'
import OffersList from './pages/offers/OffersList'
import Profile from './pages/Profile'
import './App.css'

// Public Route component
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  
  if (user) {
    return <Navigate to="/offers" />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <div className="app">
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          
          {/* Protected routes */}
          <Route path="/" element={<Navigate to="/offers" replace />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          
          {/* Offer routes */}
          <Route path="/offers" element={<ProtectedRoute><OffersList /></ProtectedRoute>} />
          <Route path="/offers/new" element={<ProtectedRoute><OfferForm /></ProtectedRoute>} />
          <Route path="/offers/:id" element={<ProtectedRoute><OfferForm /></ProtectedRoute>} />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App