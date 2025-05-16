import React from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import TaskColumn from './TaskColumn';

const TaskBoard = ({ tasks, onDragEnd, summary, onDelete }) => {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="task-board">
        <TaskColumn 
          tasks={tasks.todo} 
          status="todo" 
          title="À faire" 
          count={summary.pending} 
          onDelete={onDelete}
        />
        <TaskColumn 
          tasks={tasks.inProgress} 
          status="inProgress" 
          title="En cours" 
          count={summary.inProgress} 
          onDelete={onDelete}
        />
        <TaskColumn 
          tasks={tasks.done} 
          status="done" 
          title="Terminé" 
          count={summary.done} 
          onDelete={onDelete}
        />
      </div>
    </DragDropContext>
  );
};

export default TaskBoard;