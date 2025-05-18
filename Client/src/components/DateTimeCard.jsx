import React, { useEffect, useState } from "react";

const DateTimeCard = () => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      background: "var(--primary-lighter)",
      color: "var(--primary)",
      borderRadius: "16px",
      padding: "1.5rem 2rem",
      marginBottom: "1rem",
      boxShadow: "var(--shadow-sm)",
      fontSize: "1.1rem",
      fontWeight: "500",
      display: "inline-block"
    }}>
      <div>{dateTime.toLocaleDateString()}</div>
      <div>{dateTime.toLocaleTimeString()}</div>
    </div>
  );
};

export default DateTimeCard;