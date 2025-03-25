import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
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
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="bg-gray-50 h-screen flex">
      <Toaster position="top-right" richColors />
      
      {/* Navigation Sidebar */}
      {!isLoginPage && <Sidebar />}
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
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