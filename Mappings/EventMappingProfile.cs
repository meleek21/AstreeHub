using AutoMapper;
using ASTREE_PFE.DTOs;
using ASTREE_PFE.Models;

namespace ASTREE_PFE.Mappings
{
    public class EventMappingProfile : Profile
    {
        public EventMappingProfile()
        {
            CreateMap<EventCreateDTO, Event>();
            CreateMap<Event, EventResponseDTO>();
            CreateMap<EventUpdateDTO, Event>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
        }
    }
}