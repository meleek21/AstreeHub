import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../assets/Css/SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Tableau de bord - Super Admin";
  }, []);

  return (
    <div className="super-admin-dashboard">
      <div className="dashboard-header">
        <h1>Tableau de bord</h1>
        <p>
          Bienvenue dans votre espace privilégié. Ce module exclusif vous permet de gérer<br />
          tous les paramètres avancés du système avec simplicité et efficacité.
        </p>
      </div>
      
      <div className="dashboard-cards">
        <div 
          className="dashboard-card" 
          onClick={() => navigate('/equipes')}
          aria-label="Gérer les équipes"
        >
          <h2>Équipes</h2>
          <p>
            Créez, modifiez et organisez vos équipes.<br />
            Gérez les membres et leurs permissions.
          </p>
          <div className="card-icon">
          <lord-icon
            src="https://cdn.lordicon.com/hroklero.json"
            trigger="morph"
            stroke="bold"
            state="morph-group"
            style={{width:'100px',height:'100px'}}>
          </lord-icon>
          </div>
        </div>
        
        <div 
          className="dashboard-card" 
          onClick={() => navigate('/evenement')}
          aria-label="Gérer les événements"
        >
          <h2>Événements</h2>
          <p>
            Planifiez et supervisez tous vos événements.<br />
            Gestion complète des calendriers et participants.
          </p>
          <div className="card-icon">
          <lord-icon
            src="https://cdn.lordicon.com/xhgjylsr.json"
            trigger="morph"
            stroke="hover"
            state="hover-flutter"
            style={{width:'100px',height:'100px'}}>
          </lord-icon>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;