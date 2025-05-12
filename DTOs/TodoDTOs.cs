using System;
using ASTREE_PFE.Models.Enums;

namespace ASTREE_PFE.DTOs
{
    public class TodoCreateDTO
    {
        public string Content { get; set; }
        public DateTime? DueDate { get; set; }
        public TodoPriority Priority { get; set; } = TodoPriority.Medium;
        public TodoStatus Status { get; set; } = TodoStatus.Pending;
    }

    public class TodoUpdateDTO
    {
        public string Content { get; set; }
        public DateTime? DueDate { get; set; }
        public TodoPriority? Priority { get; set; }
        public TodoStatus? Status { get; set; }
    }

    public class TodoResponseDTO
    {
        public string Id { get; set; }
        public string UserId { get; set; }
        public string Content { get; set; }
        public DateTime? DueDate { get; set; }
        public TodoPriority Priority { get; set; }
        public TodoStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
