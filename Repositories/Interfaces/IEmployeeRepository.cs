using System.Collections.Generic;
using System.Threading.Tasks;
using ASTREE_PFE.DTOs;
using ASTREE_PFE.Models;
using Microsoft.AspNetCore.Identity;

namespace ASTREE_PFE.Repositories.Interfaces
{
    public interface IEmployeeRepository
    {
        Task<IEnumerable<Employee>> GetAllAsync();
        Task<Employee> GetByIdAsync(string id);
        Task<IEnumerable<Employee>> GetByDepartmentAsync(int departmentId);
        Task<bool> CreateAsync(Employee employee, string password);
        Task<bool> UpdateAsync(string id, Employee employee);
        Task<bool> DeleteAsync(string id);
        Task<bool> ChangeStatusAsync(string id, UserStatus status);
        Task<bool> AssignToDepartmentAsync(string employeeId, int departmentId);
        Task<List<UserInfoDTO>> GetUserInfoBatchAsync(List<string> ids);
    }
}
