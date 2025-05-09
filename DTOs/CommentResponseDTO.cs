

namespace ASTREE_PFE.DTOs
{
    public class CommentResponseDTO
    {
        public string Id { get; set; }
        public string Content { get; set; }
        public string AuthorId { get; set; }
        public string AuthorName { get; set; }
        public string AuthorProfilePicture { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<ReplyResponseDTO> Replies { get; set; }
    }
}
