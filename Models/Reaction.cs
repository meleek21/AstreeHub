using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson.Serialization.Options;

namespace ASTREE_PFE.Models
{
    public class Reaction
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        // Changed to regular string to support UUID/GUID format
        public string EmployeeId { get; set; }

        // Changed to regular string to support UUID/GUID format
        public string PostId { get; set; }

        // Changed to regular string to support UUID/GUID format if needed

        public ReactionType Type { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}
