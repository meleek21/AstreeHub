import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { authAPI } from "../../services/apiServices";
import { FaLock, FaEye, FaEyeSlash, FaArrowRight } from "react-icons/fa";
import "../../assets/Css/Auth.css";
import { useAuth } from "../../Context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState({
    email: false,
    password: false,
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFocus = (field) => {
    setIsFocused((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => {
    setIsFocused((prev) => ({ ...prev, [field]: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await authAPI.login(formData);
      if (response.data && response.data.token) {
        const user = response.data.user;
        if (user && user.isFirstLogin) {
          localStorage.setItem("token", response.data.token);
          login(response.data);
          toast("Bienvenue ! Veuillez changer votre mot de passe.", {icon: "🔒"});
          navigate("/change-password");
        } else {
          login(response.data);
          toast.success("Connexion réussie ! Redirection en cours...");
        }
      } else {
        throw new Error("Token not found in response");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Une erreur est survenue. Veuillez réessayer.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="auth-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="auth-header"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2>Connexion</h2>
        <p>Bienvenue de retour ! Connectez-vous pour accéder à votre compte.</p>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <motion.div
          className="login-form-group"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <label
            htmlFor="email"
            className={isFocused.email || formData.email ? "active" : ""}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onFocus={() => handleFocus("email")}
            onBlur={() => handleBlur("email")}
            placeholder=" "
            required
          />
          <motion.div
            className="input-underline"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isFocused.email ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>

        <motion.div
          className="login-form-group"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <label
            htmlFor="password"
            className={isFocused.password || formData.password ? "active" : ""}
          >
            Mot de passe
          </label>
          <div className="password-input">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => handleFocus("password")}
              onBlur={() => handleBlur("password")}
              placeholder=" "
              required
            />
            <motion.button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={
                showPassword
                  ? "Cacher le mot de passe"
                  : "Afficher le mot de passe"
              }
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </motion.button>
            <motion.div
              className="input-underline"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: isFocused.password ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>

        <div className="auth-actions">
          <Link to="/forgot-password" className="forgot-password">
            Mot de passe oublié?
          </Link>
        </div>

        <motion.button
          type="submit"
          className="login-button"
          disabled={isLoading}
          whileHover={
            !isLoading ? { scale: 1.02, boxShadow: "var(--shadow-md)" } : {}
          }
          whileTap={!isLoading ? { scale: 0.98 } : {}}
          initial={{ background: "var(--primary)" }}
          animate={{
            background: isLoading ? "var(--primary-light)" : "var(--primary)",
          }}
          transition={{ duration: 0.3 }}
        >
          {isLoading ? (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <FaLock />
            </motion.span>
          ) : (
            <>
              Se connecter <FaArrowRight style={{ marginLeft: "8px" }} />
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default Login;
