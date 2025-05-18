import React, { useState, useRef, useEffect } from 'react';

const AddTaskForm = ({ onAddTask }) => {
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState('Low');
  const [dueDate, setDueDate] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newTask.trim() === '') {
      // Add shake animation for empty task
      inputRef.current.classList.add('shake');
      setTimeout(() => inputRef.current.classList.remove('shake'), 500);
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddTask({ content: newTask, priority, dueDate });
      setNewTask('');
      setDueDate("");
      // Success animation
      inputRef.current.classList.add('success-pulse');
      setTimeout(() => inputRef.current.classList.remove('success-pulse'), 1000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current.focus();
  }, []);

  return (
    <form 
      className={`add-task-form ${isFocused ? 'focused' : ''}`}
      onSubmit={handleSubmit}
    >
      <div className="input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Saisir une nouvelle tâche..."
          required
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={newTask.trim() === '' ? '' : 'has-content'}
        />
        {newTask && (
          <button 
            type="button" 
            className="clear-btn"
            onClick={() => setNewTask('')}
            aria-label="Effacer l'entrée"
          >
            ✕
          </button>
        )}
      </div>
      
      <div className="date-picker-wrapper">
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className={dueDate ? 'has-date' : ''}
        />
        {!dueDate && <span className="date-placeholder">Date d'échéance</span>}
      </div>
      
      <div className="select-wrapper">
        <select 
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="Low">Basse</option>
          <option value="Medium">Moyenne</option>
          <option value="High">Haute</option>
        </select>
        <div className="select-arrow">▼</div>
      </div>
      
      <button 
        type="submit" 
        disabled={isSubmitting}
        className={isSubmitting ? 'submitting' : ''}
      >
        {isSubmitting ? (
          <span className="spinner"></span>
        ) : (
          <>
            <span className="default-text">Ajouter une tâche</span>
            <span className="hover-text">Ajouter une tâche +</span>
          </>
        )}
      </button>
    </form>
  );
};

export default AddTaskForm;