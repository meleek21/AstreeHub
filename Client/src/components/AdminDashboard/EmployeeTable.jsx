import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { userAPI, adminAPI, departmentAPI } from "../../services/apiServices";
import AdminEmployeeModal from "./AdminEmployeeModal";
import EditEmployeeModal from './EditEmployeeModal';
import '../../assets/Css/EmployeeTable.css';
import DataTable from 'react-data-table-component';
import ConfirmationModal from '../ConfirmationModal';
import { useNavigate } from "react-router-dom";

const defaultProfilePicture = 'https://res.cloudinary.com/REMOVED/image/upload/frheqydmq3cexbfntd7e.jpg';

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

const hoverScale = {
  scale: 1.03,
  transition: { type: "spring", stiffness: 400, damping: 10 }
};

const tapScale = {
  scale: 0.98
};

const EmployeeTable = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ 
    id: "",
    firstName: "", 
    lastName: "", 
    email: "", 
    phoneNumber: "", 
    dateOfBirth: "", 
    departmentId: "", 
    role: "" 
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [employeesRes, departmentsRes] = await Promise.all([
          userAPI.getAllEmployees(),
          departmentAPI.getAllDepartments()
        ]);
        setEmployees(employeesRes.data);
        setFilteredEmployees(employeesRes.data);
        setDepartments(departmentsRes.data);
      } catch (err) {
        setError("Échec du chargement des données");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = employees;
    if (selectedDepartment) {
      filtered = filtered.filter(emp => String(emp.departmentId) === String(selectedDepartment));
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(emp =>
        (emp.firstName && emp.firstName.toLowerCase().includes(term)) ||
        (emp.lastName && emp.lastName.toLowerCase().includes(term)) ||
        (emp.email && emp.email.toLowerCase().includes(term))
      );
    }
    setFilteredEmployees(filtered);
  }, [employees, selectedDepartment, searchTerm]);

  const handleEdit = (emp) => {
    setEditForm({
      id: emp.id,
      firstName: emp.firstName || "",
      lastName: emp.lastName || "",
      email: emp.email || "",
      phoneNumber: emp.phoneNumber || "",
      dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.split("T")[0] : "",
      departmentId: emp.departmentId || "",
      role: emp.role || "",
    });
    setShowEditModal(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditCancel = () => {
    setShowEditModal(false);
  };

  const handleEditSave = async () => {
    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('FirstName', editForm.firstName);
      formData.append('LastName', editForm.lastName);
      formData.append('Email', editForm.email);
      formData.append('PhoneNumber', editForm.phoneNumber);
      formData.append('DateOfBirth', editForm.dateOfBirth);
      formData.append('DepartmentId', parseInt(editForm.departmentId));
      formData.append('Role', editForm.role);

      await adminAPI.updateEmployee(editForm.id, formData);
      const updated = await userAPI.getAllEmployees();
      setEmployees(updated.data);
      setFilteredEmployees(updated.data);
      setShowEditModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Échec de la mise à jour');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (id) => {
    setEmployeeToDelete(id);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    try {
      setActionLoading(true);
      await userAPI.deleteEmployee(employeeToDelete);
      const updated = await userAPI.getAllEmployees();
      setEmployees(updated.data);
      setFilteredEmployees(updated.data);
      setShowConfirmModal(false);
      setEmployeeToDelete(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Échec de la suppression');
    } finally {
      setActionLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setEmployeeToDelete(null);
  };

  const columns = [
    {
      name: '',
      selector: row => row.profilePictureUrl,
      cell: row => (
        <motion.div 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <img
            src={row.profilePictureUrl && row.profilePictureUrl.trim() !== "" ? 
                 row.profilePictureUrl.replace(/^`|`$/g, "") : defaultProfilePicture}
            alt={`${row.firstName} ${row.lastName}`}
            className="table-profile-picture"
            onError={(e) => {
              e.target.src = defaultProfilePicture;
            }}
          />
        </motion.div>
      ),
      width: '80px',
      sortable: false
    },
    {
      name: 'Prénom',
      selector: row => row.firstName,
      sortable: true,
      cell: row => <motion.span 
        className="text-primary"
        whileHover={{ x: 3 }}
      >
        {row.firstName}
      </motion.span>,
    },
    {
      name: 'Nom',
      selector: row => row.lastName,
      sortable: true,
      cell: row => <motion.span 
        className="text-primary"
        whileHover={{ x: 3 }}
      >
        {row.lastName}
      </motion.span>,
    },
    {
      name: 'Email',
      selector: row => row.email,
      sortable: true,
      cell: row => <motion.a 
        href={`mailto:${row.email}`} 
        className="email-link"
        whileHover={{ x: 3 }}
      >
        {row.email}
      </motion.a>,
    },
    {
      name: 'Téléphone',
      selector: row => row.phoneNumber || "-",
      sortable: false,
      cell: row => row.phoneNumber ? (
        <motion.a 
          href={`tel:${row.phoneNumber}`} 
          className="phone-link"
          whileHover={{ x: 3 }}
        >
          {row.phoneNumber}
        </motion.a>
      ) : "-",
    },
    {
      name: 'Date de Naissance',
      selector: row => row.dateOfBirth ? row.dateOfBirth.split("T")[0] : "-",
      sortable: false,
    },
    {
      name: 'Département',
      selector: row => departments.find(dep => dep.id === row.departmentId)?.name || "-",
      sortable: false,
      cell: row => {
        const department = departments.find(dep => dep.id === row.departmentId);
        return department ? (
          <motion.span 
            className="department-tag"
            initial={{ scale: 1 }}
            animate={{ 
              backgroundColor: hoveredRow === row.id ? 'var(--primary-light)' : 'var(--primary-lighter)',
              color: hoveredRow === row.id ? 'white' : 'var(--primary)',
            }}
            transition={{ duration: 0.3 }}
            style={{ 
              borderRadius: '20px',
              padding: '5px'
            }}
          >
            {department.name}
          </motion.span>
        ) : "-";
      },
    },
    {
      name: 'Rôle',
      selector: row => row.role,
      sortable: false,
      cell: row => (
        <motion.span 
          className="role-badge"
          whileHover={{ scale: 1.05 }}
        >
          {row.role}
        </motion.span>
      ),
    },
    {
      name: 'Actions',
      cell: row => (
        <motion.div 
          className="action-buttons"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.button 
            onClick={() => handleEdit(row)} 
            className="btn-edit"
            disabled={actionLoading}
            aria-label="Modifier"
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(232, 140, 48, 0.1)' }}
            whileTap={{ scale: 0.95 }}
          >
            <lord-icon
              src="https://cdn.lordicon.com/nwfpiryp.json"
              trigger="hover"
              style={{width:'30px',height:'30px'}}>
            </lord-icon>
          </motion.button>
          <motion.button 
            onClick={() => handleDelete(row.id)} 
            className="btn-delete"
            disabled={actionLoading}
            aria-label="Supprimer"
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(199, 31, 22, 0.1)' }}
            whileTap={{ scale: 0.95 }}
          >
            <lord-icon
              src="https://cdn.lordicon.com/xyfswyxf.json"
              trigger="hover"
              stroke="bold"
              colors="primary:#c71f16,secondary:#c71f16"
              style={{width:'24px',height:'24px'}}>
            </lord-icon>
          </motion.button>
        </motion.div>
      ),
      width: '120px',
    },
  ];

  const LoadingComponent = () => (
    <motion.div 
      className="loading-message"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="loading-spinner"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      />
      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Chargement des employés...
      </motion.p>
    </motion.div>
  );

  const EmptyComponent = () => (
    <motion.div 
      className="empty-message"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100 }}
    >
      <lord-icon
        src="https://cdn.lordicon.com/msoeawqm.json"
        trigger="loop"
        colors="primary:#7697a0,secondary:#173b61"
        style={{width:'100px',height:'100px'}}>
      </lord-icon>
      <motion.h3
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        Aucun employé trouvé
      </motion.h3>
      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Essayez de modifier vos critères de recherche
      </motion.p>
    </motion.div>
  );

  const ErrorComponent = () => (
    <motion.div 
      className="error-message"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100 }}
    >
      <lord-icon
        src="https://cdn.lordicon.com/tdrtiskw.json"
        trigger="loop"
        colors="primary:#c71f16,secondary:#e88c30"
        style={{width:'100px',height:'100px'}}>
      </lord-icon>
      <motion.h3
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        Une erreur est survenue
      </motion.h3>
      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {error}
      </motion.p>
      <motion.button 
        onClick={() => window.location.reload()} 
        className="btn-primary"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Réessayer
      </motion.button>
    </motion.div>
  );

  return (
    <motion.div 
      className="employee-table-container"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <AnimatePresence>
        {showCreateModal && (
          <AdminEmployeeModal
            show={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            refreshEmployees={() => {
              userAPI.getAllEmployees().then(res => {
                setEmployees(res.data);
                setFilteredEmployees(res.data);
              });
            }}
          />
        )}
      </AnimatePresence>

      <motion.div className="employee-header" variants={itemVariants}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <motion.button
            onClick={() => navigate('/dashboard')}
            aria-label="Back to Dashboard"
            className="btn-back-arrow"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              marginRight: '12px',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '1.5rem',
              color: 'var(--primary)',
              outline: 'none'
            }}
            whileHover={{ scale: 1.15, color: '#173b61' }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            <span style={{ marginLeft: '6px', fontSize: '1rem' }}></span>
          </motion.button></div>
        <h2>Gestion des Employés</h2>
        <div className="employee-actions">
          <motion.button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
            whileHover={{ 
              y: -2,
              boxShadow: "0 4px 12px rgba(23, 59, 97, 0.2)"
            }}
            whileTap={{ 
              y: 0,
              scale: 0.98
            }}
          >
            +
            Nouvel Employé
          </motion.button>
          <motion.div 
            className="search-filter"
            whileHover={{ y: -1 }}
          >
            <div className="search-input-container">
              <motion.input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="search-input"
                whileFocus={{ 
                  boxShadow: "0 0 0 3px rgba(118, 151, 160, 0.3)"
                }}
              />
            </div>
            <motion.select
              value={selectedDepartment}
              onChange={e => setSelectedDepartment(e.target.value)}
              className="select-department"
              whileFocus={{ 
                boxShadow: "0 0 0 3px rgba(118, 151, 160, 0.3)"
              }}
            >
              <option value="">Tous les départements</option>
              {departments.map(dep => (
                <option key={dep.id} value={dep.id}>{dep.name}</option>
              ))}
            </motion.select>
          </motion.div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <DataTable
          columns={columns}
          data={filteredEmployees}
          progressPending={loading}
          progressComponent={<LoadingComponent />}
          noDataComponent={<EmptyComponent />}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[5, 10, 15, 20]}
          highlightOnHover
          pointerOnHover
          onRowMouseEnter={row => setHoveredRow(row.id)}
          onRowMouseLeave={() => setHoveredRow(null)}
          customStyles={{
            headCells: {
              style: {
                fontSize: '0.95rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              },
            },
            cells: {
              style: {
                fontSize: '0.9rem',
              },
            },
          }}
        />
      </motion.div>

      <AnimatePresence>
        {showEditModal && (
          <EditEmployeeModal
            show={showEditModal}
            editForm={editForm}
            departments={departments}
            onChange={handleEditFormChange}
            onCancel={handleEditCancel}
            onSave={handleEditSave}
            loading={actionLoading}
          />
        )}
      </AnimatePresence>
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Confirmation"
        message="Êtes-vous sûr de vouloir supprimer cet employé ?"
      />
    </motion.div>
  );
};

export default EmployeeTable;