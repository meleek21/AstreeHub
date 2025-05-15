using ASTREE_PFE.DTOs;
using ASTREE_PFE.Models;
using AutoMapper;
using File = ASTREE_PFE.Models.File;

namespace ASTREE_PFE.Mappings
{
    public class FileMappingProfile : Profile
    {
        public FileMappingProfile()
        {
            // Map from Entity to DTO
            CreateMap<File, FileResponseDTO>();
        }
    }
}
