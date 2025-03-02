import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import Signup from './components/Signup';
import Authen from './pages/Authen';
import Layout from './pages/Layout';
import Home from './pages/Home';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <Router>
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
            {/* Add more private routes here */}
          </Route>

          {/* Redirect to home if no route matches */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;