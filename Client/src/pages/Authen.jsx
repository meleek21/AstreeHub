import Login from '../components/Authentification/Login';
import '../assets/CSS/Authen.css';
import { motion } from 'framer-motion';

function Authen() {
 
  return (
    <motion.div className="authen-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
      {/* Welcome Panel */}
      <motion.div className={`welcome-panel`} initial={{ x: '-100vw' }} animate={{ x: 0 }} transition={{ type: 'spring', stiffness: 50 }}>
        {/*this section has image in the background*/}
      </motion.div>

      {/* Form Panel */}
      <motion.div className={`form-panel`} initial={{ x: '100vw' }} animate={{ x: 0 }} transition={{ type: 'spring', stiffness: 50 }}>
        <Login />
      </motion.div>
    </motion.div>
  );
}

export default Authen;