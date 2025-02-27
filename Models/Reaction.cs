using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace ASTREE_PFE.Models{
    public class Reaction
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public Guid Id { get; set; }

    public Guid ReactionId { get; set; }
    public Guid PostId { get; set; }
    public Guid CommentId { get; set; }
    public Guid EmployeeId { get; set; }
    public ReactionType Type { get; set; }
    public DateTime Timestamp { get; set; }
}
}