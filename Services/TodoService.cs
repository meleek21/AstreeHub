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

        public TodoService(ITodoRepository todoRepository)
        {
            _todoRepository = todoRepository;
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
            return await _todoRepository.GetUserTodosAsync(userId, status, priority, dueDate);
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
    }
}