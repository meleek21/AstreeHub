using System.Collections.Generic;
using ASTREE_PFE.DTOs;
using ASTREE_PFE.Models;
using AutoMapper;
using File = ASTREE_PFE.Models.File;

namespace ASTREE_PFE.Mappings
{
    public class PostMappingProfile : Profile
    {
        public PostMappingProfile()
        {
            // Map from DTO to Entity
            CreateMap<PostRequestDTO, Post>()
                .ForMember(dest => dest.Timestamp, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(
                    dest => dest.FileIds,
                    opt => opt.MapFrom(src => src.FileIds ?? new List<string>())
                );

            // Map from Entity to DTO (complete mapping)
            CreateMap<Post, PostResponseDTO>()
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.Timestamp))
                .ForMember(dest => dest.Files, opt => opt.Ignore()); // Files are loaded separately

            // Map for update operations (preserving Id and Timestamp)
            CreateMap<PostRequestDTO, Post>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.Timestamp, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(
                    dest => dest.FileIds,
                    opt => opt.MapFrom(src => src.FileIds ?? new List<string>())
                )
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Special mapping to include files in the PostResponseDTO - fixing the generic type
            CreateMap<(Post Post, List<File> Files), PostResponseDTO>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Post.Id))
                .ForMember(dest => dest.Content, opt => opt.MapFrom(src => src.Post.Content))
                .ForMember(dest => dest.AuthorId, opt => opt.MapFrom(src => src.Post.AuthorId))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.Post.Timestamp))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => src.Post.UpdatedAt))
                .ForMember(dest => dest.PostType, opt => opt.MapFrom(src => src.Post.PostType))
                .ForMember(dest => dest.ChannelId, opt => opt.MapFrom(src => src.Post.ChannelId))
                .ForMember(dest => dest.Files, opt => opt.MapFrom(src => src.Files));

            // Add an additional mapping for IEnumerable<File> to support both scenarios
            CreateMap<(Post Post, IEnumerable<File> Files), PostResponseDTO>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Post.Id))
                .ForMember(dest => dest.Content, opt => opt.MapFrom(src => src.Post.Content))
                .ForMember(dest => dest.AuthorId, opt => opt.MapFrom(src => src.Post.AuthorId))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.Post.Timestamp))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => src.Post.UpdatedAt))
                .ForMember(dest => dest.PostType, opt => opt.MapFrom(src => src.Post.PostType))
                .ForMember(dest => dest.ChannelId, opt => opt.MapFrom(src => src.Post.ChannelId))
                .ForMember(dest => dest.Files, opt => opt.MapFrom(src => src.Files));
        }
    }
}
