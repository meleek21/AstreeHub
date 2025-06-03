using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ASTREE_PFE.Models;
using ASTREE_PFE.Models.Enums;
using ASTREE_PFE.Repositories.Interfaces;
using ASTREE_PFE.Services.Interfaces;

namespace ASTREE_PFE.Services
{
    public class TodoService : ITodoService
    {
        private readonly ITodoRepository _todoRepository;
        private readonly INotificationService _notificationService;
        private readonly INotificationRepository _notificationRepository;

        public TodoService(
            ITodoRepository todoRepository,
            INotificationService notificationService,
            INotificationRepository notificationRepository
        )
        {
            _todoRepository = todoRepository;
            _notificationService = notificationService;
            _notificationRepository = notificationRepository;
        }

        public async Task<Todo> CreateTodoAsync(Todo todo)
        {
            return await _todoRepository.CreateAsync(todo);
        }

        public async Task<Todo> GetTodoByIdAsync(string id, string userId)
        {
            return await _todoRepository.GetByIdAsync(id, userId);
        }

        public async Task<IEnumerable<Todo>> GetUserTodosAsync(
            string userId,
            TodoStatus? status = null,
            TodoPriority? priority = null,
            DateTime? dueDate = null
        )
        {
            var todos = await _todoRepository.GetUserTodosAsync(userId, status, priority, dueDate);

            // Check for todos due tomorrow and send notifications
            await CheckAndNotifyUpcomingTodosAsync(todos, userId);

            return todos;
        }

        public async Task<Todo> UpdateTodoAsync(string id, Todo todo, string userId)
        {
            return await _todoRepository.UpdateAsync(id, todo, userId);
        }

        public async Task DeleteTodoAsync(string id, string userId)
        {
            await _todoRepository.DeleteAsync(id, userId);
        }

        public async Task<TodoSummary> GetTodoSummaryAsync(string userId)
        {
            return await _todoRepository.GetSummaryAsync(userId);
        }

        // Helper method to check for upcoming todos and send notifications
        private async Task CheckAndNotifyUpcomingTodosAsync(IEnumerable<Todo> todos, string userId)
        {
            // Tomorrow's date
            DateTime tomorrow = DateTime.Today.AddDays(1);

            // Get all existing notifications for the user to check for duplicates
            var existingNotifications = await _notificationRepository.GetNotificationsForUserAsync(
                userId
            );

            foreach (var todo in todos)
            {
                // Only check todos that haven't been completed and have a due date
                if (todo.Status != TodoStatus.Done && todo.DueDate.HasValue)
                {
                    // Check if the todo is due tomorrow
                    if (todo.DueDate.Value.Date == tomorrow.Date)
                    {
                        // Check if a notification already exists for this todo
                        bool notificationExists = existingNotifications.Any(n =>
                            n.RelatedEntityId == todo.Id
                            && n.NotificationType == NotificationType.TodoDueReminder
                        );

                        // Send notification only if it doesn't already exist
                        if (!notificationExists && !todo.DueDateNotificationSent)
                        {
                            await _notificationService.CreateTodoDueTomorrowNotificationAsync(
                                todo.Id,
                                userId
                            );

                            // Mark the todo as notified to prevent duplicate notifications
                            todo.DueDateNotificationSent = true;
                            await _todoRepository.UpdateAsync(todo.Id, todo, userId);
                        }
                    }
                }
            }
        }
    }
}
