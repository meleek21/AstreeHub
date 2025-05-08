using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using ASTREE_PFE.Models;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson.Serialization.Options;

namespace ASTREE_PFE.DTOs
{
    public class FileResponseDTO
    {
        public required string Id { get; set; }
        public required string FileName { get; set; }
        public required string FileUrl { get; set; }
        public required string FileType { get; set; }
        public long FileSize { get; set; }
        public DateTime UploadedAt { get; set; }
    }
}
