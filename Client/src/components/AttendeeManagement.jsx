import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { eventsAPI, userAPI } from '../services/apiServices';
import { useAuth } from '../Context/AuthContext';
import StatusSummary from './StatusSummary';
import InvitationModeSelector from './InvitationModeSelector';
import AttendeeItem from './AttendeeItem';
import SearchAttendees from './SearchAttendees';
import InviteAllSection from './InviteAllSection';
import InviteDepartmentSection from './InviteDepartmentSection';
import InviteSelectSection from './InviteSelectSection'

import '../assets/Css/AttendeeManagement.css';

const AttendeeManagement = ({ event, isOrganizer, onUpdate, isEditing }) => {
  const { user } = useAuth();
  const [attendees, setAttendees] = useState(event.attendees || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteMode, setInviteMode] = useState('search');
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departmentEmployees, setDepartmentEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [userDepartment, setUserDepartment] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [statusCounts, setStatusCounts] = useState({
    Accepted: 0,
    Declined: 0,
    Pending: 0
  });
  const [userAttendanceStatus, setUserAttendanceStatus] = useState({
    status: 'Pending',
    isFinal: false
  });

  // Fetch and sort attendees
  useEffect(() => {
    const filtered = (event.attendees || []).filter(id => id !== event.organizer);
    const sorted = [...filtered].sort((a, b) => {
      if (a === user.id) return -1;
      if (b === user.id) return 1;
      const statusOrder = { 'Accepted': 1, 'Declined': 2, 'Pending': 3 };
      return statusOrder[event.attendeeStatuses?.[a] || 'Pending'] - 
             statusOrder[event.attendeeStatuses?.[b] || 'Pending'];
    });
    setAttendees(sorted);
  }, [event.attendees, event.attendeeStatuses, event.organizer, user.id]);

  // Fetch departments and user department
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await eventsAPI.getAllDepartments();
        setDepartments(response.data);
      } catch (error) {
        toast.error('Échec du chargement des départements');
      }
    };

    const fetchUserDepartment = async () => {
      try {
        const userInfo = await userAPI.getUserInfo(user.id);
        if (userInfo.data.departmentId) {
          const deptResponse = await eventsAPI.getDepartmentEmployees(userInfo.data.departmentId);
          setUserDepartment(deptResponse.data);
          setSelectedDepartment(deptResponse.data.id);
        }
      } catch (error) {
        console.error("Échec de la récupération du département de l'utilisateur :", error);
      }
    };

    if (isOrganizer && !event.isOpenEvent) {
      fetchDepartments();
      fetchUserDepartment();
    }
  }, [isOrganizer, event.isOpenEvent, user.id]);

  // Fetch user's attendance status
  useEffect(() => {
    const fetchUserStatus = async () => {
      if (!user?.id || isOrganizer || event.isOpenEvent) return;
      
      try {
        const { data } = await eventsAPI.getUserAttendanceStatus(event.id, user.id);
        setUserAttendanceStatus({
          status: data.status,
          isFinal: data.isFinal
        });
      } catch (error) {
        setUserAttendanceStatus({ status: 'Pending', isFinal: false });
      }
    };
    fetchUserStatus();
  }, [event.id, user?.id, isOrganizer, event.isOpenEvent]);

  // Fetch status counts
  useEffect(() => {
    const fetchStatusCounts = async () => {
      try {
        const response = await eventsAPI.getAttendanceStatusCounts(event.id);
        setStatusCounts(response.data);
      } catch (error) {
        const counts = calculateLocalStatusCounts();
        setStatusCounts(counts);
      }
    };
    fetchStatusCounts();
  }, [event, onUpdate]);

  const calculateLocalStatusCounts = () => {
    const counts = { Accepted: 0, Declined: 0, Pending: 0 };
    attendees.forEach(attendeeId => {
      const status = event.attendeeStatuses?.[attendeeId] || 'Pending';
      if (status === 'Accepted') counts.Accepted++;
      else if (status === 'Declined') counts.Declined++;
      else counts.Pending++;
    });
    return counts;
  };

  const handleSearch = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await eventsAPI.searchEmployees(query);
      const filteredResults = response.data.filter(emp => 
        !attendees.some(a => a === emp.id)
      );
      setSearchResults(filteredResults);
    } catch (error) {
      toast.error('Échec de la recherche des employés');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDepartmentChange = async (departmentId) => {
    setSelectedDepartment(departmentId);
    if (!departmentId) return;
    
    try {
      setIsLoading(true);
      const response = await eventsAPI.getDepartmentEmployees(departmentId);
      const filteredResults = response.data.filter(emp => 
        !attendees.some(a => a === emp.id)
      );
      setDepartmentEmployees(filteredResults);
    } catch (error) {
      toast.error('Échec de la récupération des employés du département');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEmployeeSelection = (employee) => {
    setSelectedEmployees(prev => 
      prev.some(emp => emp.id === employee.id) 
        ? prev.filter(emp => emp.id !== employee.id) 
        : [...prev, employee]
    );
  };

  const handleInviteAll = async () => {
    try {
      setIsSending(true);
      await eventsAPI.inviteAll(event.id);
      toast.success('Invitations envoyées à tous les employés');
      onUpdate();
    } catch (error) {
      toast.error("Échec de l'envoi des invitations");
    } finally {
      setIsSending(false);
    }
  };

  const handleInviteDepartment = async () => {
    if (!selectedDepartment) {
      toast.error('Veuillez sélectionner un département');
      return;
    }

    try {
      setIsSending(true);
      await eventsAPI.inviteDepartment(event.id, selectedDepartment);
      toast.success('Invitations envoyées aux employés du département');
      onUpdate();
    } catch (error) {
      toast.error("Échec de l'envoi des invitations");
    } finally {
      setIsSending(false);
    }
  };

  const handleInviteSelected = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Veuillez sélectionner au moins un employé');
      return;
    }

    try {
      setIsSending(true);
      const employeeIds = selectedEmployees.map(emp => emp.id);
      await eventsAPI.inviteMultiple(event.id, employeeIds);
      toast.success(`Invitations envoyées à ${selectedEmployees.length} employés`);
      setSelectedEmployees([]);
      onUpdate();
    } catch (error) {
      toast.error("Échec de l'envoi des invitations");
    } finally {
      setIsSending(false);
    }
  };

  const handleAddAttendee = async (employee) => {
    try {
      await eventsAPI.addAttendee(event.id, { employeeId: employee.id });
      toast.success(`${employee.name} ajouté à l'événement`);
      onUpdate();
    } catch (error) {
      toast.error(`Échec de l'ajout de ${employee.name}`);
    }
  };

  const handleRemoveAttendee = async (attendeeId) => {
    try {
      await eventsAPI.removeAttendee(event.id, attendeeId);
      toast.success('Participant supprimé');
      onUpdate();
    } catch (error) {
      toast.error('Échec de la suppression du participant');
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!user?.id || userAttendanceStatus.isFinal) return;
    
    try {
      setUserAttendanceStatus(prev => ({ ...prev, status: newStatus, isFinal: true }));
      await eventsAPI.updateAttendanceStatus(event.id, user.id, newStatus);
      await fetchStatusCounts();
      onUpdate();
      toast.success(`Invitation ${newStatus.toLowerCase() === 'accepted' ? 'acceptée' : 'refusée'}`);
    } catch (error) {
      setUserAttendanceStatus(prev => ({ ...prev, status: 'Pending', isFinal: false }));
      toast.error(`Échec de la mise à jour du statut`);
    }
  };

  const getAttendeeStatus = (attendeeId) => {
    return attendeeId === user.id ? userAttendanceStatus.status : 'Pending';
  };

  return (
    <div className="attendee-management">
      <h3>
        <FontAwesomeIcon icon={faUsers} className="mr-2" />
        Participants ({attendees.length})
      </h3>
      
      {!event.isOpenEvent && attendees.length > 0 && (
        <StatusSummary statusCounts={statusCounts} />
      )}

      {isOrganizer && !event.isOpenEvent && (
        <div className="invitation-options mb-3">
          <h4>Envoyer des invitations</h4>
          <InvitationModeSelector 
            inviteMode={inviteMode} 
            setInviteMode={setInviteMode} 
          />

          {inviteMode === 'all' && (
            <InviteAllSection 
              handleInviteAll={handleInviteAll}
              isSending={isSending}
            />
          )}

          {inviteMode === 'department' && (
            <InviteDepartmentSection
              departments={departments}
              selectedDepartment={selectedDepartment}
              handleDepartmentChange={handleDepartmentChange}
              handleInviteDepartment={handleInviteDepartment}
              isSending={isSending}
            />
          )}

          {inviteMode === 'select' && (
            <InviteSelectSection
              departments={departments}
              selectedDepartment={selectedDepartment}
              departmentEmployees={departmentEmployees}
              selectedEmployees={selectedEmployees}
              handleDepartmentChange={handleDepartmentChange}
              toggleEmployeeSelection={toggleEmployeeSelection}
              handleInviteSelected={handleInviteSelected}
              isSending={isSending}
            />
          )}
        </div>
      )}

      {isOrganizer && !event.isOpenEvent && inviteMode === 'search' && (
        <SearchAttendees
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          handleSearch={handleSearch}
          handleAddAttendee={handleAddAttendee}
          isLoading={isLoading}
        />
      )}

      <div className="attendees-list">
        {attendees.map(attendeeId => (
          <AttendeeItem
            key={attendeeId}
            attendeeId={attendeeId}
            isOrganizer={isOrganizer}
            isEditing={isEditing}
            user={user}
            userAttendanceStatus={userAttendanceStatus}
            handleStatusChange={handleStatusChange}
            handleRemoveAttendee={handleRemoveAttendee}
            event={event}
            getAttendeeStatus={getAttendeeStatus}
          />
        ))}
        
        {attendees.length === 0 && (
          <div className="no-attendees">
            {event.isOpenEvent 
              ? "Ceci est un événement ouvert - aucune confirmation requise"
              : "Aucun participant pour le moment"}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendeeManagement;