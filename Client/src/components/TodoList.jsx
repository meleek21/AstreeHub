import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import { todoAPI } from '../services/apiServices';
import SummaryCards from './SummaryCards';
import AddTaskForm from './AddTaskForm';
import TaskBoard from './TaskBoard';
import '../assets/Css/TodoList.css';
import toast, { Toaster } from 'react-hot-toast';

const TodoList = () => {
  const [tasks, setTasks] = useState({
    todo: [],
    inProgress: [],
    done: [],
  });
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    done: 0,
    low: 0,
    medium: 0,
    high: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (userId) {
      fetchTasks();
      fetchSummary();
    }
  }, [userId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await todoAPI.getTodos(userId);
      if (response.data) {
        const todo = response.data.filter(task => task.status === 'Pending');
        const inProgress = response.data.filter(task => task.status === 'InProgress');
        const done = response.data.filter(task => task.status === 'Done');
        setTasks({ todo, inProgress, done });
      }
    } catch (err) {
      setError('Échec de la récupération des tâches');
      toast.error('Échec de la récupération des tâches');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await todoAPI.getTodoSummary(userId);
      if (response.data) {
        setSummary({
          total: response.data.totalCount || 0,
          pending: response.data.pendingCount || 0,
          inProgress: response.data.inProgressCount || 0,
          done: response.data.doneCount || 0,
          low: response.data.lowPriorityCount || 0,
          medium: response.data.mediumPriorityCount || 0,
          high: response.data.highPriorityCount || 0
        });
      }
    } catch (err) {
      console.error('Échec de la récupération du résumé', err);
      toast.error('Échec de la récupération du résumé');
    }
  };

  const addTask = async ({ content, priority, dueDate }) => {
    if (!content.trim() || !userId) {
      setError("Veuillez saisir une tâche et assurez-vous d'être connecté");
      toast.error("Veuillez saisir une tâche et assurez-vous d'être connecté");
      return;
    }
    
    try {
      const todoData = {
        content,
        status: 'Pending',
        priority: priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase(),
        dueDate: dueDate ? new Date(dueDate) : undefined
      };
      const response = await todoAPI.createTodo(todoData, userId);
      if (response.status !== 201) {
        throw new Error('Échec de la création de la tâche');
      }
      fetchTasks();
      fetchSummary();
      toast.success('Tâche ajoutée avec succès');
    } catch (err) {
      console.error('API Error:', err.response?.data);
      setError(err.response?.data?.message || 'Échec de l\'ajout de la tâche');
      toast.error(err.response?.data?.message || 'Échec de l\'ajout de la tâche');
    }
  };

  const deleteTask = async (id) => {
    if (!id || !userId) return;
    try {
      await todoAPI.deleteTodo(id, userId);
      fetchTasks();
      fetchSummary();
      toast.success('Tâche supprimée avec succès');
    } catch (err) {
      setError('Échec de la suppression de la tâche');
      toast.error('Échec de la suppression de la tâche');
      console.error(err);
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceList = [...tasks[source.droppableId]];
    const [removed] = sourceList.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      sourceList.splice(destination.index, 0, removed);
      setTasks({
        ...tasks,
        [source.droppableId]: sourceList,
      });
    } else {
      const destinationList = [...tasks[destination.droppableId]];
      let newStatus = 'Pending';
      
      if (destination.droppableId === 'inProgress') newStatus = 'InProgress';
      else if (destination.droppableId === 'done') newStatus = 'Done';

      const updatedTask = { 
        ...removed, 
        status: newStatus, 
        priority: removed.priority.charAt(0).toUpperCase() + removed.priority.slice(1).toLowerCase() 
      };
      
      destinationList.splice(destination.index, 0, updatedTask);

      setTasks({
        ...tasks,
        [source.droppableId]: sourceList,
        [destination.droppableId]: destinationList,
      });

      try {
        await todoAPI.updateTodo(
          updatedTask.id, 
          { 
            content: updatedTask.content, 
            status: newStatus, 
            priority: updatedTask.priority, 
            dueDate: updatedTask.dueDate 
          }, 
          userId
        );
        fetchSummary();
        toast.success('Super ! Tâche mise à jour avec succès !');
      } catch (err) {
        console.error('Échec de la mise à jour du statut de la tâche', err);
        toast.error('Échec de la mise à jour du statut de la tâche');
        if (err.response) {
          console.error('Backend error response:', err.response.data);
        }
        fetchTasks();
      }
    }
  };

  return (
    <div className="todo-app">
      <SummaryCards summary={summary} />
      
      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Chargement des tâches...</div>
      ) : (
        <TaskBoard tasks={tasks} onDragEnd={onDragEnd} summary={summary} onDelete={deleteTask} />
      )}
      
      <AddTaskForm onAddTask={addTask} />
    </div>
  );
};

export default TodoList;