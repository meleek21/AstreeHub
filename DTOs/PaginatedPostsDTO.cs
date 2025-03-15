namespace ASTREE_PFE.DTOs
{
    public class PaginatedPostsDTO
    {
        public IEnumerable<PostResponseDTO> Posts { get; set; }
        public string NextLastItemId { get; set; }
        public bool HasMore { get; set; }
    }
}