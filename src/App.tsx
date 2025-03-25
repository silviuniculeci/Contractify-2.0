import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import Login from './pages/Login'
import ProjectList from './pages/projects/ProjectList'
import TestPage from './pages/TestPage'
import ProjectForm from './pages/projects/ProjectForm'
import './App.css'
import RoleBasedRoute from './components/RoleBasedRoute'

// Simplified App component with minimal routes
function App() {
  console.log('App component rendering');
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors />
      
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-blue-600">Contractify</span>
              </div>
              <nav className="ml-8 flex items-center space-x-4">
                <a href="/" className="px-3 py-2 text-gray-700 hover:text-blue-600">Home</a>
                <a href="/test" className="px-3 py-2 text-gray-700 hover:text-blue-600">Test</a>
                <a href="/projects" className="px-3 py-2 text-gray-700 hover:text-blue-600">Projects</a>
                <a href="/login" className="px-3 py-2 text-gray-700 hover:text-blue-600">Login</a>
              </nav>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/projects/new" element={
            <RoleBasedRoute allowedRoles={['ADMIN', 'MANAGER', 'OPERATIONS']}>
              <ProjectForm />
            </RoleBasedRoute>
          } />
          <Route path="/projects/:projectId/edit" element={
            <RoleBasedRoute allowedRoles={['ADMIN', 'MANAGER', 'OPERATIONS']}>
              <ProjectForm />
            </RoleBasedRoute>
          } />
          <Route path="/projects/from-offer/:offerId" element={
            <RoleBasedRoute allowedRoles={['ADMIN', 'MANAGER', 'OPERATIONS']}>
              <ProjectForm />
            </RoleBasedRoute>
          } />
          <Route path="/" element={
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
              <div className="bg-white shadow rounded-lg p-8">
                <h1 className="text-2xl font-bold mb-4">Welcome to Contractify</h1>
                <p className="mb-4">Your complete solution for project management and contract handling.</p>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
                  <p className="text-blue-800">Browse your projects or create new implementation plans.</p>
                </div>
              </div>
            </div>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App