import React from "react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import "../assets/Css/Portal.css";
import WeatherCard from "./WeatherCard";
import MiniCalendar from "./MiniCalendar";
import UpcomingEvents from "./UpcomingEvents";
import ClosestBirthdays from "./ClosestBirthdays";
import EventList from "./AdminMemories/EventList/EventList";
import Brainstorming from '../assets/Brainstorming.png';
import DateTimeCard from "./DateTimeCard";
import astreeLogo from '../assets/astree.png'
import { Link, useNavigate } from "react-router-dom";
import { postsAPI } from "../services/apiServices";

const Portal = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await postsAPI.getEventPosts();
        setEvents(res.data.posts || res.data.Posts || []);
      } catch (err) {
        // Optionally handle error
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        when: "beforeChildren"
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };
  
  const headerVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 10
      }
    }
  };
  
  const imageVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        delay: 0.3,
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <motion.div 
      className="portal-container"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div className="portal-header" variants={headerVariants}>
        <motion.img 
          src={astreeLogo} 
          alt="Astree Logo" 
          className="portal-logo" 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        />
        <div className="search-bar">
          <lord-icon
            src="https://cdn.lordicon.com/fkdzyfle.json"
            trigger="hover"
            colors="primary:#AB9DFF"
            style={{ width: '25px', height: '25px' }}
          ></lord-icon>
          <input type="text" placeholder="Que recherchez-vous ?" />
        </div>
        <motion.div className="portal-header-icons">
          <motion.button
            className="portal-login-btn"
            onClick={e => { e.preventDefault(); navigate('/se-connecter'); }}
            whileHover={{ scale: 1.05, backgroundColor: "var(--primary)" }}
            whileTap={{ scale: 0.95 }}
          >
            Se connecter
          </motion.button>
        </motion.div>
      </motion.div>
      
      <div className="portal-main">
        <div className="portal-left">
          <motion.div className="portal-weather" variants={itemVariants}>
            <WeatherCard />
          </motion.div>
          <motion.div className="portal-announcements" variants={itemVariants}>
            <DateTimeCard/>
          </motion.div>
          <motion.div className="portal-calendar" variants={itemVariants}>
            <MiniCalendar/>
          </motion.div>
        </div>
        
        <div className="portal-center">
  <motion.div 
    className="portal-image-container"
    variants={imageVariants}
  >
    <div className="portal-image-text">
      <span style={{ fontSize: '1.5rem', fontWeight: 500, color: 'var(--secondary)' }}>
        Bienvenue sur le portail collaboratif ASTREE !
      </span>
    </div>
    <div className="portal-image">
      <img src={Brainstorming} alt="Brainstorming" />
    </div>
  </motion.div>
  <motion.div className="portal-news" variants={itemVariants}>
    <EventList events={events} loading={loading} />
  </motion.div>
</div>
        
        <div className="portal-right">
          <motion.div className="portal-birthdays" variants={itemVariants}>
            <ClosestBirthdays/>
          </motion.div>
          <motion.div className="portal-events" variants={itemVariants}>
            <UpcomingEvents/>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Portal;