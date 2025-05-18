import React from 'react';
import { Draggable } from '@hello-pangea/dnd';

const TaskCard = ({ task, index, onDelete }) => {
  return (
    <Draggable key={task.id} draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`task-card ${task.priority?.toLowerCase()} ${snapshot.isDragging ? 'dragging' : ''}`}
          style={{
            ...provided.draggableProps.style,
            userSelect: 'none'
          }}
        >
          <div className="task-content">{task.content}</div>
          {task.dueDate && <div className="task-time">{new Date(task.dueDate).toLocaleDateString()}</div>}
          <div className="task-footer">
            <div className="task-checkmark" data-status={task.status?.toLowerCase()} />
            <div className="priority-dots">
              <span className={`dot ${['low','medium','high'].includes(task.priority?.toLowerCase()) ? 'active' : ''}`} />
              <span className={`dot ${['medium','high'].includes(task.priority?.toLowerCase()) ? 'active' : ''}`} />
              <span className={`dot ${task.priority?.toLowerCase() === 'high' ? 'active' : ''}`} />
            </div>
            <button 
              onClick={() => onDelete(task.id)} 
              className="delete-btn"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default TaskCard;