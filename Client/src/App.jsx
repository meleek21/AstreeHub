import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import Authen from './pages/Authen';
import Layout from './pages/Layout';
import Home from './pages/Home';
import Feed from './pages/Feed';
import ChannelsList from './pages/ChannelsList';
import ChannelFeed from './pages/ChannelFeed';
import ErrorBoundary from './components/ErrorBoundary';
import EditableProfile from './components/EditableProfile';
import ProfileViewer from './components/ProfileViewer';
import Calendar from './pages/Calendar';
import Bibliotheque from './pages/Bibliotheque';
import ChatContainer from './components/Messages/ChatContainer';
import EmployeeTable from './components/AdminDashboard/EmployeeTable';
import AdminMemories from './components/AdminMemories/AdminMemories';
import Equipe from './components/Equipe';
import { AuthProvider } from './Context/AuthContext';
import { OnlineStatusProvider } from './Context/OnlineStatusContext';
import { ChatProvider } from './Context/ChatContext';
import { NotificationProvider } from './Context/NotificationContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ChangePassword from './components/ChangePassword';
import CompleteProfile from './components/CompleteProfile';
import Portal from './components/Portal';
// Create a client
const queryClient = new QueryClient();


function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <OnlineStatusProvider>
            <ChatProvider>
            <NotificationProvider>
              <div className="app">
                <Toaster />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Portal />} />
            <Route path="/se-connecter" element={<Authen />} />
            <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
         

            {/* Private routes wrapped in Layout */}
            <Route element={<Layout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/feed" element={<ErrorBoundary><Feed /></ErrorBoundary>} />
              <Route path="/channels" element={<ChannelsList />} />
              <Route path="/channel/:channelId" element={<ErrorBoundary><ChannelFeed /></ErrorBoundary>} />
              <Route path="/profile/edit/:userId" element={<ErrorBoundary><EditableProfile /></ErrorBoundary>} />
              <Route path='/profile/view/:userId' element={<ErrorBoundary> <ProfileViewer/> </ErrorBoundary>}/>
              <Route path="/evenement" element={<ErrorBoundary><Calendar /></ErrorBoundary>} />
              <Route path="/messages" element={<ErrorBoundary><ChatContainer /></ErrorBoundary>} />
              <Route path="/bibliotheque" element={<ErrorBoundary><Bibliotheque /></ErrorBoundary>} />
              <Route path="/recherche-equipe" element={<ErrorBoundary><Equipe /></ErrorBoundary>} />
              <Route path="/equipes" element={<ErrorBoundary><EmployeeTable /></ErrorBoundary>} />
              <Route path="/memories" element={<ErrorBoundary><AdminMemories /></ErrorBoundary>} />
              
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredRole="SUPERADMIN">
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                }
              />
              
            </Route>

            {/* Redirect to home if no route matches */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
              </div>
              </NotificationProvider>
            </ChatProvider>
          </OnlineStatusProvider>
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App;