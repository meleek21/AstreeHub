import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import EventForm from '../components/Event/EventForm';
import EventDetails from '../components/Event/EventDetails';
import EventSideBar from '../components/EventSideBar';
import ModalPortal from '../components/ModalPortal';
import { eventsAPI } from '../services/apiServices';
import '../assets/Css/Calendar.css';

const Calendar = () => {
  const getEventTypeColor = (type) => {
    const typeColors = {
      'Général': '#3788d8',
      'Réunion': '#2c3e50',
      'Formation': '#27ae60',
      'ÉvénementEntreprise': '#8e44ad',
      'Personnel': '#e67e22',
      'Anniversaire': '#e74c3c',
      'Technique': '#3498db'
    };
    return typeColors[type] || typeColors['Général'];
  };

  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEvents();
    fetchBirthdays();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await eventsAPI.getAllEvents();
      setEvents(response.data);
    } catch (error) {
      console.error('Échec de la récupération des événements:', error);
    }
  };

  const fetchBirthdays = async () => {
    try {
      const response = await eventsAPI.GetTodaysBirthdays();
      setBirthdays(response.data);
    } catch (error) {
      console.error('Échec de la récupération des anniversaires:', error);
    }
  };

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calendarEvents = [
    ...filteredEvents.map(event => ({
      id: event.id,
      title: event.title,
      start: event.eventDateTime,
      end: event.endDateTime,
      backgroundColor: getEventTypeColor(event.type),
      borderColor: getEventTypeColor(event.type),
      extendedProps: {
        description: event.description,
        location: event.location,
        category: event.category,
        isOpenEvent: event.isOpenEvent,
        attendees: event.attendees || [],
        organizerName: event.organizerName,
        organizer: event.organizer,
        type: event.type || 'Général'
      }
    })),
    ...birthdays.map(birthday => ({
      id: `birthday-${birthday.employeeId}`,
      title: `Anniversaire de ${birthday.firstName} ${birthday.lastName}`,
      start: birthday.birthDate,
      allDay: true,
      backgroundColor: '#ff7675',
      borderColor: '#ff7675',
      extendedProps: {
        isBirthday: true,
        employeeId: birthday.employeeId
      }
    }))
  ];

  const handleDateClick = (arg) => {
    setSelectedDate(arg.date);
    setShowEventForm(true);
  };

  const handleEventClick = (info) => {
    setSelectedEvent({
      ...info.event.extendedProps,
      id: info.event.id,
      title: info.event.title,
      eventDateTime: info.event.start,
      endDateTime: info.event.end,
      type: info.event.extendedProps.type || 'Général'
    });
  };

  const handleEventCreated = () => {
    fetchEvents();
    setShowEventForm(false);
  };

  const handleEventDeleted = async () => {
    await fetchEvents();
    setSelectedEvent(null);
  };

  const handleSearchChange = (term) => {
    setSearchTerm(term);
  };

  return (
    <div className="calendar-app-container">
      <div className="calendar-main-content">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: ''
          }}
          events={calendarEvents}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="auto"
          nowIndicator={true}
          editable={true}
          selectable={true}
          eventDisplay="block"
          eventColor="#3788d8"
          dayMaxEventRows={3} // Limit visible events per day
          dayMaxEvents={3}    // Show "+ more" if exceeded

          aspectRatio={1.5}   // Width/height ratio
          locale="fr"
          buttonText={{
            today: "Aujourd'hui",
            month: 'Mois',
          }}
          dayHeaderFormat={{ weekday: 'short' }}
          dayHeaderContent={(arg) => {
            return <div className="day-header">{arg.text}</div>;
          }}
          dayCellContent={(arg) => {
            return <div className="day-number">{arg.dayNumberText}</div>;
          }}
          eventContent={(arg) => {
            return (
              <div className="calendar-event" style={{ backgroundColor: arg.backgroundColor }}>
                {arg.event.title}
              </div>
            );
          }}
        />
      </div>

      <EventSideBar onSearchChange={handleSearchChange} onCreateEvent={() => setShowEventForm(true)} />

      {showEventForm && (
        <ModalPortal>
          <div className="post-editor-overlay" onClick={() => setShowEventForm(false)}>
            <div className="post-editor-content" onClick={e => e.stopPropagation()}>
              <EventForm 
                selectedDate={selectedDate} 
                onClose={() => setShowEventForm(false)}
                onEventCreated={handleEventCreated}
              />
            </div>
          </div>
        </ModalPortal>
      )}

      {selectedEvent && (
        <ModalPortal>
          <div className="post-editor-overlay" onClick={() => setSelectedEvent(null)}>
            <div  onClick={e => e.stopPropagation()}>
              <EventDetails 
                event={selectedEvent}
                onClose={() => setSelectedEvent(null)}
                onDelete={handleEventDeleted}
                onUpdate={fetchEvents}
              />
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default Calendar;