using ASTREE_PFE.Models.Enums;

namespace ASTREE_PFE.Models
{
    public class TodoSummary
    {
        public int TotalCount { get; set; }
        
        // Status counts
        public int PendingCount { get; set; }
        public int InProgressCount { get; set; }
        public int DoneCount { get; set; }
        
        // Priority counts
        public int LowPriorityCount { get; set; }
        public int MediumPriorityCount { get; set; }
        public int HighPriorityCount { get; set; }
    }
}