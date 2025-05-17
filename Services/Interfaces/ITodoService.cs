using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ASTREE_PFE.Models;
using ASTREE_PFE.Models.Enums;

namespace ASTREE_PFE.Services.Interfaces
{
    public interface ITodoService
    {
        Task<Todo> CreateTodoAsync(Todo todo);
        Task<Todo> GetTodoByIdAsync(string id, string userId);
        Task<IEnumerable<Todo>> GetUserTodosAsync(
            string userId,
            TodoStatus? status = null,
            TodoPriority? priority = null,
            DateTime? dueDate = null
        );
        Task<Todo> UpdateTodoAsync(string id, Todo todo, string userId);
        Task DeleteTodoAsync(string id, string userId);
        Task<TodoSummary> GetTodoSummaryAsync(string userId);
    }
}
