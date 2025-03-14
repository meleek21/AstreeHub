using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ASTREE_PFE.Models
{
    public enum ReactionType
    {
        [BsonRepresentation(BsonType.String)]
        None,
        [BsonRepresentation(BsonType.String)]
        Jaime,
        [BsonRepresentation(BsonType.String)]
        Jadore,
        [BsonRepresentation(BsonType.String)]
        Brillant,
        [BsonRepresentation(BsonType.String)]
        Bravo,
        [BsonRepresentation(BsonType.String)]
        Youpi
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
