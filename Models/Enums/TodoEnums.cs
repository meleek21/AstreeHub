using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ASTREE_PFE.Models.Enums
{
    public enum TodoStatus
    {
        [BsonRepresentation(BsonType.String)]
        Pending,

        [BsonRepresentation(BsonType.String)]
        InProgress,

        [BsonRepresentation(BsonType.String)]
        Done,
    }

    public enum TodoPriority
    {
        [BsonRepresentation(BsonType.String)]
        High,

        [BsonRepresentation(BsonType.String)]
        Medium,

        [BsonRepresentation(BsonType.String)]
        Low,
    }
}
