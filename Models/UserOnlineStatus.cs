using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ASTREE_PFE.Models
{
    public class UserOnlineStatus
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string UserId { get; set; }

        public bool IsOnline { get; set; }

        public DateTime LastActivityTime { get; set; }

        public DateTime LastSeenTime { get; set; }
    }
}