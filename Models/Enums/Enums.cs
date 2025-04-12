using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ASTREE_PFE.Models
{
    public enum EventType
    {
        General,
        Holiday,
        Meeting,
        Birthday
    }

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

    public enum EventCategory
    {
        [BsonRepresentation(BsonType.String)]
        Meeting,
        [BsonRepresentation(BsonType.String)]
        Training,
        [BsonRepresentation(BsonType.String)]
        Conference,
        [BsonRepresentation(BsonType.String)]
        TeamBuilding,
        [BsonRepresentation(BsonType.String)]
        Other,
        [BsonRepresentation(BsonType.String)]
        Birthday
    }

    public enum EventStatus
    {
        [BsonRepresentation(BsonType.String)]
        Upcoming,
        [BsonRepresentation(BsonType.String)]
        Scheduled,
        [BsonRepresentation(BsonType.String)]
        InProgress,
        [BsonRepresentation(BsonType.String)]
        Completed,
        [BsonRepresentation(BsonType.String)]
        Cancelled
    }

    public enum AttendanceStatus
    {
        [BsonRepresentation(BsonType.String)]
        Pending,
        [BsonRepresentation(BsonType.String)]
        Accepted,
        [BsonRepresentation(BsonType.String)]
        Declined
    }
}
