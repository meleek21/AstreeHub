import React from 'react';
import { motion } from 'framer-motion';
import TodoList from '../components/TaskList/TodoList';
import MiniCalendar from '../components/MiniCalendar';
import UpcomingEvents from '../components/UpcomingEvents';
import WelcomeBadge from '../components/WelcomeBadge';
import DateTimeCard from '../components/DateTimeCard';
import WeatherCard from '../components/WeatherCard';
import '../assets/Css/Home.css';

function Home() {
  return (
    <div className="dashboard-container">
      <header className="home-header">
        <div className="home-header-content">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='widget'
          >
            <WelcomeBadge />
            <DateTimeCard />
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="header-widgets"
          >
            <WeatherCard />
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
       

        {/* Center Column - Todo List */}
        <div className="dashboard-column center-column">
          <div className="column-content">
            <TodoList />
          </div>
        </div>
         {/* Left Column - Stacked Calendar and Events */}
         <div className="dashboard-column left-column">
          <div className="column-content">
            <MiniCalendar />
          </div>
          <div className="column-content">
            <UpcomingEvents />
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;