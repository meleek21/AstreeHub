import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import Signup from './components/Signup';
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
import ChatContainer from './components/Messages/ChatContainer';
import { AuthProvider } from './Context/AuthContext';
import { OnlineStatusProvider } from './Context/OnlineStatusContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Create a client
const queryClient = new QueryClient();


function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <OnlineStatusProvider>
            <div className="app">
              <Toaster />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Authen />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<Navigate to="authen" />} />

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
              
            </Route>

            {/* Redirect to home if no route matches */}
            <Route path="*" element={<Navigate to="/home" />} />
          </Routes>
            </div>
          </OnlineStatusProvider>
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App;