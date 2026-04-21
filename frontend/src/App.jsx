import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import DashboardLayout from './components/layout/DashboardLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Dashboard from './pages/dashboard/Dashboard'
import AccountManager from './pages/dashboard/AccountManager'
import VirtualGroups from './pages/dashboard/VirtualGroups'
import CampaignPanel from './pages/dashboard/CampaignPanel'
import MessageTemplates from './pages/dashboard/MessageTemplates'
import Inbox from './pages/dashboard/Inbox'
import Reports from './pages/dashboard/Reports'
import Profile from './pages/dashboard/Profile'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="accounts" element={<AccountManager />} />
            <Route path="groups" element={<VirtualGroups />} />
            <Route path="templates" element={<MessageTemplates />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="campaigns" element={<CampaignPanel />} />
            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
