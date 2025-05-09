using System.ComponentModel.DataAnnotations; 
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ASTREE_PFE.Models
{
    public class File
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [Required] // Now recognized
        public string FileName { get; set; }

        [Required] // Now recognized
        public string FileUrl { get; set; }

        [Required]
        public string PublicId { get; set; } = null!; // Cloudinary public ID for file management

        [Required]
        public string UploaderId { get; set; } = null!; // ID of the user who uploaded the file

        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        public string FileType { get; set; } // e.g., "image/jpeg", "application/pdf"
        public long FileSize { get; set; } // File size in bytes
        public string Description { get; set; } // Optional description for the file
        public string? PostId { get; set; } // ID of the post this file is attached to
    }
}
