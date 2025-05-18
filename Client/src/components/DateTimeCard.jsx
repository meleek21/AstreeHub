import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiClock, FiCalendar } from "react-icons/fi";
import "../assets/Css/DateTimeCard.css";

const DateTimeCard = () => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format date and time
  const timeString = dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = dateTime.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <motion.div 
      className="datetime-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <motion.div 
        className="datetime-header"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        
      </motion.div>

      <motion.div 
        className="time-display"
        key={timeString}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {timeString}
      </motion.div>

      <div className="date-section">
        <motion.div 
          className="date-icon"
          whileHover={{ scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <FiCalendar />
        </motion.div>
        <motion.div 
          className="date-display"
          key={dateString}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          {dateString}
        </motion.div>
      </div>

      <motion.div 
        className="seconds-indicator"
        animate={{ 
          scale: [1, 1.2, 1],
          backgroundColor: ['var(--primary-light)', 'var(--accent)', 'var(--primary-light)']
        }}
        transition={{ 
          duration: 1, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
};

export default DateTimeCard;