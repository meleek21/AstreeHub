import React from "react";
import { useAuth } from "../Context/AuthContext";

const WelcomeBadge = () => {
  const { user } = useAuth();
  return (
    <div style={{
      background: "var(--gradient-primary)",
      color: "var(--text-on-dark)",
      borderRadius: "16px",
      padding: "1.5rem 2rem",
      marginBottom: "1rem",
      boxShadow: "var(--shadow-md)",
      fontSize: "1.3rem",
      fontWeight: "bold",
      display: "inline-block"
    }}>
      Welcome{user ? `, ${user.firstName} ${user.lastName}` : "!"}
    </div>
  );
};

export default WelcomeBadge;