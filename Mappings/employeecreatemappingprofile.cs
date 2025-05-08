using ASTREE_PFE.DTOs;
using ASTREE_PFE.Models;
using AutoMapper;

namespace ASTREE_PFE.Mappings
{
    public class EmployeeCreateMappingProfile : Profile
    {
        public EmployeeCreateMappingProfile()
        {
            CreateMap<EmployeeCreateDto, Employee>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.Email))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => UserStatus.Active));

            CreateMap<Employee, EmployeeResponseDto>();
        }
    }
}
