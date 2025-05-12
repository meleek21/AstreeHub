using System;
using ASTREE_PFE.DTOs;
using ASTREE_PFE.Models;
using AutoMapper;

namespace ASTREE_PFE.Mappings
{
    public class TodoMappingProfile : Profile
    {
        public TodoMappingProfile()
        {
            // Map from DTO to Entity
            CreateMap<TodoCreateDTO, Todo>()
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

            CreateMap<TodoUpdateDTO, Todo>()
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Map from Entity to DTO
            CreateMap<Todo, TodoResponseDTO>();
        }
    }
}
