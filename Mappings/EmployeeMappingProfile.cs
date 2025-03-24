using AutoMapper;
using ASTREE_PFE.DTOs;
using ASTREE_PFE.Models;

namespace ASTREE_PFE.Mappings
{
    public class EmployeeMappingProfile : Profile
    {
        public EmployeeMappingProfile()
        {
            CreateMap<EmployeeUpdateDto, Employee>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            CreateMap<Employee, EmployeeResponseDto>();
            CreateMap<Employee, EmployeeDTO>();
            CreateMap<Employee, UserInfoDTO>();
        }
    }
}