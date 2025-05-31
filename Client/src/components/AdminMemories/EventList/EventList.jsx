import React from "react";
import Carousel from "react-bootstrap/Carousel";
import EventItem from "./EventItem";
import { postsAPI } from "../../../services/apiServices";
import toast from "react-hot-toast";

function EventList({ events, onEdit, onDelete, onImageSelect, user, loading }) {
  if (loading) {
    return <div className="loading-message" role="status" aria-live="polite">Chargement des événements...</div>;
  }

  if (!events || events.length === 0) {
    return <div className="no-events-message">Aucun événement à afficher.</div>;
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
            user={user}
          />
        </Carousel.Item>
      ))}
    </Carousel>
  );
}

export default EventList;