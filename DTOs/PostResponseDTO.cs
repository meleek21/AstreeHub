using System;
using System.Collections.Generic;
using ASTREE_PFE.Models;
using System.ComponentModel.DataAnnotations;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson.Serialization.Options;
using MongoDB.Bson.Serialization.Options;

namespace ASTREE_PFE.DTOs
{
    public class PostResponseDTO
{
    public string Id { get; set; }
    public string Content { get; set; }
    public string AuthorId { get; set; }
    public string AuthorName { get; set; }
    public string AuthorProfilePicture { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<Document> Documents { get; set; }
    public List<CommentResponseDTO> Comments { get; set; }
    [BsonDictionaryOptions(DictionaryRepresentation.ArrayOfDocuments)]
    public Dictionary<ReactionType, int> ReactionCounts { get; set; } = new();
    public ReactionType? UserReaction { get; set; }
    public string ChannelId { get; set; }
}
}
