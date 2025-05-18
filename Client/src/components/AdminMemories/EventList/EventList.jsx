import React from "react";
import Carousel from "react-bootstrap/Carousel";
import EventItem from "./EventItem";

function EventList({ events, loading, onEdit, onDelete, onImageSelect }) {
  if (loading) {
    return <div className="loading-message" role="status" aria-live="polite">Chargement des événements...</div>;
  }

  return (
    <Carousel className="events-carousel" interval={3000} indicators={events.length > 1}>
      {events.map((event) => (
        <Carousel.Item key={event.id || event.Id}>
          <EventItem
            event={event}
            onEdit={onEdit}
            onDelete={onDelete}
            onImageSelect={onImageSelect}
          />
        </Carousel.Item>
      ))}
    </Carousel>
  );
}

export default EventList;