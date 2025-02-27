using ASTREE_PFE.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASTREE_PFE.Repositories
{
    public interface IDepartmentRepository
    {
        Task<IEnumerable<Department>> GetAllAsync();
        Task<Department> GetByIdAsync(int id);
        Task<Department> CreateAsync(Department department);
        Task<bool> UpdateAsync(int id, Department department);
        Task<bool> DeleteAsync(int id);
        Task<IEnumerable<Employee>> GetEmployeesInDepartmentAsync(int departmentId);
        Task<bool> AssignDirectorAsync(int departmentId, string employeeId);
    }
}