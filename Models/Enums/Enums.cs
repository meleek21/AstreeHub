using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ASTREE_PFE.Models
{
    public enum ReactionType
    {
        [BsonRepresentation(BsonType.String)]
        None,
        [BsonRepresentation(BsonType.String)]
        Like,
        [BsonRepresentation(BsonType.String)]
        Love,
        [BsonRepresentation(BsonType.String)]
        Haha,
        [BsonRepresentation(BsonType.String)]
        Wow,
        [BsonRepresentation(BsonType.String)]
        Sad,
        [BsonRepresentation(BsonType.String)]
        Angry
    }

    public enum RoleType
    {
        EMPLOYEE,
        SUPERADMIN,
        DIRECTOR
    }

    public enum UserStatus
    {
        Active,
        Inactive,
        Suspended
    }
}
