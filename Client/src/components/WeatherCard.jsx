import React, { useState, useEffect } from 'react';
import { weatherAPI } from '../services/apiServices';
import { WiDaySunny, WiRain, WiCloudy, WiSnow, WiThunderstorm, WiFog } from 'react-icons/wi';
import { motion, AnimatePresence } from 'framer-motion';
import '../assets/Css/WeatherCard.css';

const WeatherCard = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coords, setCoords] = useState({ 
    lat: 36.8065,
    lon: 10.1815 
  });
  const [locationAccess, setLocationAccess] = useState('prompt');
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  // 1. Request geolocation permission and set coordinates
  useEffect(() => {
    const getLocation = () => {
      if (!navigator.geolocation) {
        setLocationAccess('denied');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
          setLocationAccess('granted');
        },
        (err) => {
          console.error("Geolocation error:", err);
          setLocationAccess('denied');
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    };

    getLocation();

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (err) => console.error("Geolocation watch error:", err)
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // 2. Fetch weather data when coordinates change or manual refresh
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = locationAccess === 'granted' 
          ? await weatherAPI.getWeatherData(coords.lat, coords.lon)
          : await weatherAPI.getWeatherData(36.8065, 10.1815);
        setWeather(response.data);
      } catch (err) {
        setError(err.response?.data || "Failed to fetch weather data");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [coords, locationAccess, refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => !prev);
  };

  // Weather icon mapping with animations
  const getWeatherIcon = (condition) => {
    if (!condition) return (
      <motion.div 
        animate={{ rotate: 20 }}
        transition={{ 
          repeat: Infinity, 
          repeatType: "mirror",
          duration: 5
        }}
      >
        <WiDaySunny />
      </motion.div>
    );
    
    const weatherId = condition.id;
    
    // Different animations based on weather type
    if (weatherId >= 200 && weatherId < 300) return (
      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
        <WiThunderstorm />
      </motion.div>
    );
    
    if (weatherId >= 300 && weatherId < 600) return (
      <motion.div animate={{ y: [0, 2, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
        <WiRain />
      </motion.div>
    );
    
    if (weatherId >= 600 && weatherId < 700) return (
      <motion.div animate={{ rotate: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
        <WiSnow />
      </motion.div>
    );
    
    if (weatherId >= 700 && weatherId < 800) return <WiFog />;
    if (weatherId === 800) return (
      <motion.div 
        animate={{ rotate: 20 }}
        transition={{ 
          repeat: Infinity, 
          repeatType: "mirror",
          duration: 5
        }}
      >
        <WiDaySunny />
      </motion.div>
    );
    
    return (
      <motion.div animate={{ opacity: [0.8, 1, 0.8] }} transition={{ repeat: Infinity, duration: 3 }}>
        <WiCloudy />
      </motion.div>
    );
  };

  return (
    <motion.div 
      className="weather-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            className="weather-loading"
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              style={{ 
                width: 24, 
                height: 24, 
                borderRadius: '50%', 
                border: `3px solid var(--primary-light)`,
                borderTopColor: 'var(--accent)',
                margin: '0 auto 10px'
              }}
            />
            Chargement météo...
          </motion.div>
        ) : error ? (
          <motion.div 
            className="weather-error"
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {error}
            <motion.button 
              onClick={handleRefresh}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="refresh-button"
            >
              Réessayer
            </motion.button>
          </motion.div>
        ) : weather ? (
          <motion.div
            key="weather"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="weather-header">
              <h2>
                {weather.name} 
                {locationAccess === 'denied' && (
                  <span className="location-fallback"> (Emplacement par défaut)</span>
                )}
              </h2>
              <motion.button 
                onClick={handleRefresh}
                whileHover={{ rotate: 30 }}
                whileTap={{ scale: 0.9 }}
                className="refresh-button"
                aria-label="Refresh weather"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path 
                    d="M4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C9.536 4 7.332 5.114 5.864 6.864L4 5M4 12V3M4 12H13" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.button>
            </div>

            <div className="weather-icon-container">
              {getWeatherIcon(weather.weather?.[0])}
            </div>

            <div className="weather-details">
              <motion.p 
                className="weather-temp"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {Math.round(weather.main?.temp)}°C
              </motion.p>
              
              <motion.p 
                className="weather-condition"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {weather.weather?.[0]?.description}
              </motion.p>
              
              <motion.div 
                className="weather-stats"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.span 
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  Humidité : {weather.main?.humidity}%
                </motion.span>
                <motion.span 
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  Vent : {weather.wind?.speed} km/h
                </motion.span>
              </motion.div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
};

export default WeatherCard;