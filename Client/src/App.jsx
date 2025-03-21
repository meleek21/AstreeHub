import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import Signup from './components/Signup';
import Authen from './pages/Authen';
import Layout from './pages/Layout';
import Home from './pages/Home';
import Feed from './pages/Feed';
import Channels from './pages/Channels';
import ChannelFeed from './pages/ChannelFeed';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './Context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';


function App() {
  return (
    <Router>
      <AuthProvider>
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
              <Route path="/channels" element={<Channels />} />
              <Route path="/channel/:channelId" element={<ErrorBoundary><ChannelFeed /></ErrorBoundary>} />
              {/* Add more private routes here */}
            </Route>

            {/* Redirect to home if no route matches */}
            <Route path="*" element={<Navigate to="/home" />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;