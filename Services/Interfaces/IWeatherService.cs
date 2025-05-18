using System.Threading.Tasks;

namespace ASTREE_PFE.Services.Interfaces
{
    public interface IWeatherService
    {
        Task<object> GetWeatherDataAsync(double lat, double lon);
    }
}