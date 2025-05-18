import React from "react";
import { useAuth } from "../Context/AuthContext";
import { motion } from "framer-motion";
import { FiSun, FiMoon, FiCoffee } from "react-icons/fi";
import "../assets/Css/WelcomeBadge.css";

const WelcomeBadge = () => {
  const { user } = useAuth();
  const currentHour = new Date().getHours();
  
  // Determine greeting and icon based on time of day
  let greeting, icon;
  if (currentHour < 5) {
    greeting = 'Bonne nuit';
    icon = <FiMoon />;
  } else if (currentHour < 12) {
    greeting = 'Bonjour';
    icon = <FiSun />;
  } else if (currentHour < 17) {
    greeting = 'Bon après-midi';
    icon = <FiSun />;
  } else {
    greeting = 'Bonsoir';
    icon = <FiCoffee />;
  }

  return (
    <motion.div 
      className="welcome-badge"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      whileHover={{ scale: 1.02 }}
    >
      <motion.div 
        className="welcome-icon"
        animate={{ 
          rotate: [0, 10, -10, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 1.5,
          repeat: Infinity,
          repeatDelay: 3
        }}
      >
        {icon}
      </motion.div>
      
      <div className="welcome-badge-text">
        {greeting}{user ? `, ${user.firstName} ${user.lastName}` : '!'}
      </div>
      
    </motion.div>
  );
};

export default WelcomeBadge;