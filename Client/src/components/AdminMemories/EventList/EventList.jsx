import React, { useEffect, useState } from "react";
import Carousel from "react-bootstrap/Carousel";
import EventItem from "./EventItem";
import { postsAPI } from "../../../services/apiServices";
import toast from "react-hot-toast";

function EventList({ onEdit, onDelete, onImageSelect, user }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await postsAPI.getEventPosts();
      setEvents(res.data.posts || res.data.Posts || []);
    } catch (err) {
      toast.error("Échec de la récupération des événements.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);
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
            user={user}
          />
        </Carousel.Item>
      ))}
    </Carousel>
  );
}

export default EventList;