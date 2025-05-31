import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { userAPI } from '../services/apiServices';
import { departmentAPI} from '../services/apiServices';
import ProfileCard from './ProfileCard';
import '../assets/Css/Equipe.css';
import Poeple from '../assets/People-search.png';
function Equipe() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [empRes, deptRes] = await Promise.all([
          userAPI.getAllEmployees(),
          departmentAPI.getAllDepartments()
        ]);
        
        setEmployees(empRes.data);
        setFilteredEmployees(empRes.data);
        setDepartments(deptRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = employees;
    if (search) {
      filtered = filtered.filter(e =>
        (`${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
         e.email.toLowerCase().includes(search.toLowerCase()))
      );
    }
    if (selectedDept) {
      filtered = filtered.filter(e => String(e.departmentId) === String(selectedDept));
    }
    setFilteredEmployees(filtered);
  }, [search, selectedDept, employees]);

  return (
    <motion.div 
      className="equipe-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h2 
        className="equipe-title"
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      >
        Notre Équipe
      </motion.h2>
      
      <motion.div 
        className="equipe-controls"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="equipe-search-bar">
          <lord-icon
            src="https://cdn.lordicon.com/fkdzyfle.json"
            trigger="hover"
            colors="primary:#FFA07A"
            style={{ width: '25px', height: '25px' }}
          ></lord-icon>
          <input
            type="text"
            placeholder="Rechercher par nom ou e-mail"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        <select
          value={selectedDept}
          onChange={e => setSelectedDept(e.target.value)}
          className="equipe-department-select"
          whileHover={{ scale: 1.02 }}
          whileFocus={{ scale: 1.02 }}
        >
          <option value="">Tous les départements</option>
          {departments.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
      </motion.div>
      
      {isLoading ? (
        <motion.div 
          className="equipe-empty"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Chargement des membres de l'équipe...
        </motion.div>
      ) : (
        <div className="equipe-list">
          <AnimatePresence>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp, index) => (
                <motion.div
                  key={String(emp.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  layout
                >
                  <ProfileCard userId={emp.id} />
                </motion.div>
              ))
            ) : (
                <motion.div 
                className="equipe-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <img src={Poeple} alt="Aucun employé trouvé" />
                <p>Aucun employé trouvé. Essayez d'ajuster vos critères de recherche.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

export default Equipe;