
using System.ComponentModel.DataAnnotations;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ASTREE_PFE.Models
{
    public class Channel
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        [Required]
        public string Name { get; set; } = null!;

        // Nullable for general channels that aren't tied to a specific department
        public int? DepartmentId { get; set; }

        // Flag to identify general channels accessible to all users
        public bool IsGeneral { get; set; }

        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation property for Department (if applicable)
        [BsonIgnore]
        public virtual Department? Department { get; set; }
    }
}
