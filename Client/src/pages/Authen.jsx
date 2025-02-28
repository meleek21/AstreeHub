import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Signup from '../components/Signup';
import Login from '../components/Login'; 
import '../assets/CSS/Authen.css'; 

function Authen() {
  const location = useLocation();
  const [isSignup, setIsSignup] = useState(location.state?.isSignup ?? true);

  return (
    <div className="authen-container">
      {/* Welcome Panel */}
      <div className={`welcome-panel ${isSignup ? 'left' : 'right'}`}>
        <h1>Bienvenue !</h1>
        <p>
          {isSignup
            ? 'Vous avez déjà un compte ?'
            : 'Vous avez besoin d’un compte ?'}
        </p>
        <button
          className="toggle-button"
          onClick={() => setIsSignup(!isSignup)}
        >
          {isSignup ? 'Se connecter' : "S'inscrire"}
        </button>
      </div>

      {/* Form Panel */}
      <div className={`form-panel ${isSignup ? 'right' : 'left'}`}>
        {isSignup ? <Signup /> : <Login />}
      </div>
    </div>
  );
}

export default Authen;