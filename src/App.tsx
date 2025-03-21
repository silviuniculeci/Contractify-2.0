import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import OfferForm from './pages/offers/OfferForm'
import OffersList from './pages/offers/OffersList'
import Profile from './pages/Profile'
import './App.css'
import { AuthProvider } from './contexts/AuthContext'

// Protected Route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  
  if (!user) {
    return <Navigate to="/login" />
  }
  
  return <>{children}</>
}

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
      <Router>
        <Routes>
          {/* Redirect root to offers list */}
          <Route path="/" element={<Navigate to="/offers" replace />} />
          
          {/* Login route */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          
          {/* Offers routes */}
          <Route
            path="/offers"
            element={
              <ProtectedRoute>
                <OffersList />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/offers/new"
            element={
              <ProtectedRoute>
                <OfferForm />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/offers/:id"
            element={
              <ProtectedRoute>
                <OfferForm />
              </ProtectedRoute>
            }
          />
          
          {/* Profile route */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App