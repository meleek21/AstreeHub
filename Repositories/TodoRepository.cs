using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ASTREE_PFE.Models;
using ASTREE_PFE.Models.Enums;
using ASTREE_PFE.Repositories.Interfaces;
using MongoDB.Driver;

namespace ASTREE_PFE.Repositories
{
    public class TodoRepository : ITodoRepository
    {
        private readonly IMongoCollection<Todo> _todoCollection;

        public TodoRepository(IMongoDatabase database)
        {
            _todoCollection = database.GetCollection<Todo>("Todos");
        }

        public async Task<Todo> CreateAsync(Todo todo)
        {
            todo.CreatedAt = DateTime.UtcNow;
            todo.UpdatedAt = DateTime.UtcNow;
            await _todoCollection.InsertOneAsync(todo);
            return todo;
        }

        public async Task<Todo> GetByIdAsync(string id, string userId)
        {
            var filter = Builders<Todo>.Filter.And(
                Builders<Todo>.Filter.Eq(t => t.Id, id),
                Builders<Todo>.Filter.Eq(t => t.UserId, userId)
            );

            return await _todoCollection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<Todo>> GetUserTodosAsync(
            string userId,
            TodoStatus? status = null,
            TodoPriority? priority = null,
            DateTime? dueDate = null
        )
        {
            var filterBuilder = Builders<Todo>.Filter;
            var filter = filterBuilder.Eq(t => t.UserId, userId);

            if (status.HasValue)
            {
                filter = filter & filterBuilder.Eq(t => t.Status, status.Value);
            }

            if (priority.HasValue)
            {
                filter = filter & filterBuilder.Eq(t => t.Priority, priority.Value);
            }

            if (dueDate.HasValue)
            {
                var startOfDay = dueDate.Value.Date;
                var endOfDay = startOfDay.AddDays(1).AddTicks(-1);
                filter =
                    filter
                    & filterBuilder.Gte(t => t.DueDate, startOfDay)
                    & filterBuilder.Lte(t => t.DueDate, endOfDay);
            }

            return await _todoCollection.Find(filter).ToListAsync();
        }

        public async Task<Todo> UpdateAsync(string id, Todo todoUpdate, string userId)
        {
            var filter = Builders<Todo>.Filter.And(
                Builders<Todo>.Filter.Eq(t => t.Id, id),
                Builders<Todo>.Filter.Eq(t => t.UserId, userId)
            );

            todoUpdate.UpdatedAt = DateTime.UtcNow;

            var update = Builders<Todo>
                .Update.Set(t => t.Content, todoUpdate.Content)
                .Set(t => t.DueDate, todoUpdate.DueDate)
                .Set(t => t.Priority, todoUpdate.Priority)
                .Set(t => t.Status, todoUpdate.Status)
                .Set(t => t.UpdatedAt, todoUpdate.UpdatedAt);

            var options = new FindOneAndUpdateOptions<Todo>
            {
                ReturnDocument = ReturnDocument.After,
            };

            return await _todoCollection.FindOneAndUpdateAsync(filter, update, options);
        }

        public async Task DeleteAsync(string id, string userId)
        {
            var filter = Builders<Todo>.Filter.And(
                Builders<Todo>.Filter.Eq(t => t.Id, id),
                Builders<Todo>.Filter.Eq(t => t.UserId, userId)
            );

            await _todoCollection.DeleteOneAsync(filter);
        }

        public async Task<TodoSummary> GetSummaryAsync(string userId)
        {
            var todos = await GetUserTodosAsync(userId);
            var todosList = todos.ToList();

            var summary = new TodoSummary
            {
                TotalCount = todosList.Count,

                // Status counts
                PendingCount = todosList.Count(t => t.Status == TodoStatus.Pending),
                InProgressCount = todosList.Count(t => t.Status == TodoStatus.InProgress),
                DoneCount = todosList.Count(t => t.Status == TodoStatus.Done),

                // Priority counts
                LowPriorityCount = todosList.Count(t => t.Priority == TodoPriority.Low),
                MediumPriorityCount = todosList.Count(t => t.Priority == TodoPriority.Medium),
                HighPriorityCount = todosList.Count(t => t.Priority == TodoPriority.High),
            };

            return summary;
        }
    }
}
