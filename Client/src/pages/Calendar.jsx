import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import EventForm from '../components/EventForm';
import EventDetails from '../components/EventDetails';
import { eventsAPI } from '../services/apiServices';
import '../assets/Css/Calendar.css';

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [birthdays, setBirthdays] = useState([]);

  useEffect(() => {
    fetchEvents();
    fetchBirthdays();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await eventsAPI.getAllEvents();
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const fetchBirthdays = async () => {
    try {
      const response = await eventsAPI.GetTodaysBirthdays();
      setBirthdays(response.data);
    } catch (error) {
      console.error('Failed to fetch birthdays:', error);
    }
  };

  // Convert events to FullCalendar format
  const calendarEvents = [
    ...events.map(event => ({
      id: event.id,
      title: event.title,
      start: event.eventDateTime,
      end: event.endDateTime,
      extendedProps: {
        description: event.description,
        location: event.location,
        category: event.category,
        isOpenEvent: event.isOpenEvent,
        attendees: event.attendees || [],
        organizerName: event.organizerName,
        organizer: event.organizer
      }
    })),
    ...birthdays.map(birthday => ({
      id: `birthday-${birthday.employeeId}`,
      title: `${birthday.firstName} ${birthday.lastName}'s Birthday`,
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
      endDateTime: info.event.end
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

  return (
    <div className="calendar-container">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
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
      />

      {showEventForm && (
        <div className="event-form-sidebar">
          <EventForm 
            selectedDate={selectedDate} 
            onClose={() => setShowEventForm(false)}
            onEventCreated={handleEventCreated}
          />
        </div>
      )}

      {selectedEvent && (
        <div className="event-details-sidebar">
          <EventDetails 
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onDelete={handleEventDeleted}
            onUpdate={fetchEvents}
          />
        </div>
      )}
    </div>
  );
};

export default Calendar;