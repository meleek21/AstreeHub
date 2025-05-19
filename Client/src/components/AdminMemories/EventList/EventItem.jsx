import React from "react";
import { motion } from "framer-motion";
import QuiltedGrid from "./QuiltedGrid";

function EventItem({ event, onEdit, onDelete, onImageSelect,user }) {
  return (
    <motion.li 
      className="event-item"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      tabIndex="0"
      aria-label={`Événement : ${event.content?.slice(0, 30)}`}
      role="listitem"
      onKeyDown={e => {
        if (e.key === 'Enter') onEdit(event);
        if (e.key === 'Delete') onDelete(event.id || event.Id);
      }}
    >
      <div className="preview-content" tabIndex="0">{event.content}</div>
      {event.files && event.files.length > 0 && (
        <div className="event-files-container">
          <QuiltedGrid 
            files={event.files} 
            onImageSelect={onImageSelect}
          />
        </div>
      )}
      {user?.role === 'SuperAdmin' && (
        <div className="event-actions">
        <button onClick={() => onEdit(event)} className="edit-button" aria-label="Modifier l'événement" tabIndex="0">
          Modifier
        </button>
        <button 
          onClick={() => onDelete(event.id || event.Id)} 
          className="delete-button"
          aria-label="Supprimer l'événement"
          tabIndex="0"
        >
          Supprimer
        </button>
      </div>
      )}
      
    </motion.li>
  );
}

export default EventItem;