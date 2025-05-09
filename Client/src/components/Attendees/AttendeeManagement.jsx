import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { eventsAPI, userAPI } from '../../services/apiServices';
import { useAuth } from '../../Context/AuthContext';
import StatusSummary from './StatusSummary';
import InvitationModeSelector from '../Invitations/InvitationModeSelector';
import AttendeeItem from './AttendeeItem';
import SearchAttendees from '../Invitations/SearchAttendees';
import InviteAllSection from '../Invitations/InviteAllSection';
import InviteDepartmentSection from '../Invitations/InviteDepartmentSection';
import InviteSelectSection from '../Invitations/InviteSelectSection';
import '../../assets/Css/AttendeeManagement.css';

const AttendeeManagement = ({ event, isOrganizer, onUpdate, isEditing }) => {
  const { user } = useAuth();
  const [attendees, setAttendees] = useState(event.attendees || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteMode, setInviteMode] = useState('search');
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [statusCounts, setStatusCounts] = useState({
    Accepté: 0,
    Refusé: 0,
    EnAttente: 0
  });
  const [userAttendanceStatus, setUserAttendanceStatus] = useState({
    status: 'EnAttente',
    isFinal: false
  });
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);

  // Fetch and sort attendees
  useEffect(() => {
    const filtered = (event.attendees || []).filter(id => id !== event.organizer);
    const sorted = [...filtered].sort((a, b) => {
      if (a === user.id) return -1;
      if (b === user.id) return 1;
      const statusOrder = { 'Accepté': 1, 'Refusé': 2, 'En attente': 3 };
      return statusOrder[event.attendeeStatuses?.[a] || 'En attente'] -
        statusOrder[event.attendeeStatuses?.[b] || 'En attente'];
    });
    setAttendees(sorted);
  }, [event.attendees, event.attendeeStatuses, event.organizer, user.id]);

  // Fetch all employees
  useEffect(() => {
    const fetchAllEmployees = async () => {
      if (isOrganizer && !event.isOpenEvent) {
        try {
          const response = await userAPI.getAllEmployees();
          setAllEmployees(response.data);
        } catch (error) {
          toast.error('Échec de récupérer tous les employés');
        }
      }
    };
    fetchAllEmployees();
  }, [isOrganizer, event.isOpenEvent]);

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await eventsAPI.getAllDepartments();
        setDepartments(response.data);
      } catch (error) {
        toast.error('Échec de charger les départements');
      }
    };

    if (isOrganizer && !event.isOpenEvent) {
      fetchDepartments();
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
        setUserAttendanceStatus({ status: 'EnAttente', isFinal: false });
      }
    };
    fetchUserStatus();
  }, [event.id, user?.id, isOrganizer, event.isOpenEvent, event.attendeeStatuses]);
  
  // Function to refresh user status after changes
  const refreshUserStatus = async () => {
    if (!user?.id || isOrganizer || event.isOpenEvent) return;
    
    try {
      const { data } = await eventsAPI.getUserAttendanceStatus(event.id, user.id);
      setUserAttendanceStatus({
        status: data.status,
        isFinal: data.isFinal
      });
      
      // Also refresh status counts
      const response = await eventsAPI.getAttendanceStatusCounts(event.id);
      setStatusCounts(response.data);
      
      // Notify parent component about the update
      if (typeof onUpdate === 'function') {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to refresh user status:', error);
    }
  };

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
    const counts = { Accepté: 0, Refusé: 0, EnAttente: 0 };
    attendees.forEach(attendeeId => {
      const status = event.attendeeStatuses?.[attendeeId] || 'EnAttente';
      if (status === 'Accepté') counts.Accepté++;
      else if (status === 'Refusé') counts.Refusé++;
      else counts.EnAttente++;
    });
    return counts;
  };

  const getAttendeeStatus = (attendeeId) => {
    if (attendeeId === user.id) {
      return userAttendanceStatus.status;
    }
    return event.attendeeStatuses?.[attendeeId] || 'EnAttente';
  };

  const getAttendeeIsFinal = (attendeeId) => {
    if (attendeeId === user.id) {
      return userAttendanceStatus.isFinal;
    }
    return true; // Other attendees' statuses are considered final (only user can change their own status)
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
      toast.error('Échec de rechercher des employés');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteAll = async () => {
    try {
      setIsSending(true);
      await eventsAPI.inviteAll(event.id);
      toast.success('Invitations envoyées à tous les employés');
      onUpdate();
    } catch (error) {
      toast.error("Échec d'envoyer les invitations");
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
      toast.error("Échec d'envoyer les invitations");
    } finally {
      setIsSending(false);
    }
  };

  const toggleEmployeeSelection = (emp) => {
    setSelectedEmployees(prev =>
      prev.some(e => e.id === emp.id)
        ? prev.filter(e => e.id !== emp.id)
        : [...prev, emp]
    );
  };

  const handleInviteSelected = async () => {
    try {
      setIsSending(true);
      await eventsAPI.inviteSelected(event.id, selectedEmployees.map(e => e.id));
      toast.success('Employés sélectionnés invités avec succès');
      setSelectedEmployees([]);
      onUpdate();
    } catch (error) {
      toast.error('Échec d\'inviter les employés sélectionnés');
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
      toast.error(`Échec d'ajouter ${employee.name}`);
    }
  };

  const handleRemoveAttendee = async (attendeeId) => {
    try {
      await eventsAPI.removeAttendee(event.id, attendeeId);
      setAttendees(prev => prev.filter(id => id !== attendeeId));
      setStatusCounts(prev => {
        const status = event.attendeeStatuses?.[attendeeId] || 'EnAttente';
        return {
          ...prev,
          [status]: Math.max(0, prev[status] - 1)
        };
      });
      toast.success('Participant supprimé avec succès');
      if (typeof onUpdate === 'function') {
        onUpdate();
      }
    } catch (error) {
      toast.error('Échec de supprimer le participant');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setIsLoading(true);
      // Update attendance status via API
      await eventsAPI.updateAttendanceStatus(event.id, user.id, newStatus);
      
      // Refresh user's attendance status
      const { data } = await eventsAPI.getUserAttendanceStatus(event.id, user.id);
      setUserAttendanceStatus({
        status: data.status,
        isFinal: data.isFinal
      });
      
      // Update status counts
      try {
        const response = await eventsAPI.getAttendanceStatusCounts(event.id);
        setStatusCounts(response.data);
      } catch (error) {
        console.error('Failed to update status counts:', error);
      }
      
      toast.success('Statut de participation mis à jour');
      
      // Notify parent component to refresh event data
      if (typeof onUpdate === 'function') {
        onUpdate();
      }
      
      return true; // Return success for AttendeeItem component
    } catch (error) {
      console.error('Échec de mettre à jour le statut de participation:', error);
      toast.error('Échec de mettre à jour le statut de participation');
      throw error; // Propagate error to AttendeeItem for state reversion
    } finally {
      setIsLoading(false);
    }
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

      {isOrganizer && !event.isOpenEvent && !isEditing && (
        <div className="invitation-options mb-3">
          <h4>Envoyer des invitations</h4>
          <InvitationModeSelector
            inviteMode={inviteMode}
            setInviteMode={setInviteMode}
          />

          {inviteMode === 'all' && (
            <InviteAllSection
              employees={allEmployees}
              handleInviteAll={handleInviteAll}
              isSending={isSending}
            />
          )}

          {inviteMode === 'department' && (
            <InviteDepartmentSection
              departments={departments}
              selectedDepartment={selectedDepartment}
              handleDepartmentChange={setSelectedDepartment}
              handleInviteDepartment={handleInviteDepartment}
              isSending={isSending}
            />
          )}

          {inviteMode === 'select' && (
            <InviteSelectSection
              employees={allEmployees}
              organizerDepartmentId={user.departmentId}
              selectedEmployees={selectedEmployees}
              toggleEmployeeSelection={toggleEmployeeSelection}
              handleInviteSelected={handleInviteSelected}
              isSending={isSending}
            />
          )}
        </div>
      )}

      {isEditing && (
        <>
          <SearchAttendees
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            handleSearch={handleSearch}
            handleAddAttendee={handleAddAttendee}
            isLoading={isLoading}
          />

          <div className="attendees-list">
            {attendees.map(attendeeId => (
              <AttendeeItem
                key={attendeeId}
                attendeeId={attendeeId}
                isOrganizer={isOrganizer}
                isEditing={isEditing}
                user={user}
                status={getAttendeeStatus(attendeeId)}
                isFinal={getAttendeeIsFinal(attendeeId)}
                handleStatusChange={handleStatusChange}
                handleRemoveAttendee={handleRemoveAttendee}
                event={event}
              />
            ))}

            {attendees.length === 0 && (
              <div className="no-attendees">
                {event.isOpenEvent
                  ? "Cet événement est ouvert - aucune confirmation requise"
                  : "Aucun participant pour l'instant"}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AttendeeManagement;