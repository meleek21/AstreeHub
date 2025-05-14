using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ASTREE_PFE.Models;
using ASTREE_PFE.Models.Enums;

namespace ASTREE_PFE.Repositories.Interfaces
{
    public interface ITodoRepository
    {
        Task<Todo> CreateAsync(Todo todo);
        Task<Todo> GetByIdAsync(string id, string userId);
        Task<IEnumerable<Todo>> GetUserTodosAsync(
            string userId, 
            TodoStatus? status = null,
            TodoPriority? priority = null,
            DateTime? dueDate = null
        );
        Task<Todo> UpdateAsync(string id, Todo todoUpdate, string userId);
        Task DeleteAsync(string id, string userId);
        Task<TodoSummary> GetSummaryAsync(string userId);
    }
}