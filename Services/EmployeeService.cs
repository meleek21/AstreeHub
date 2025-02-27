using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories;
using ASTREE_PFE.Services.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASTREE_PFE.Services
{
    public class EmployeeService : IEmployeeService
    {
        private readonly IEmployeeRepository _employeeRepository;

        public EmployeeService(IEmployeeRepository employeeRepository)
        {
            _employeeRepository = employeeRepository;
        }

        public async Task<IEnumerable<Employee>> GetAllEmployeesAsync()
        {
            return await _employeeRepository.GetAllAsync();
        }

        public async Task<Employee> GetEmployeeByIdAsync(string id)
        {
            return await _employeeRepository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<Employee>> GetEmployeesByDepartmentAsync(int departmentId)
        {
            return await _employeeRepository.GetByDepartmentAsync(departmentId);
        }

        public async Task<bool> CreateEmployeeAsync(Employee employee, string password)
        {
            return await _employeeRepository.CreateAsync(employee, password);
        }

        public async Task<bool> UpdateEmployeeAsync(string id, Employee employee)
        {
            return await _employeeRepository.UpdateAsync(id, employee);
        }

        public async Task<bool> DeleteEmployeeAsync(string id)
        {
            return await _employeeRepository.DeleteAsync(id);
        }

        public async Task<bool> ChangeEmployeeStatusAsync(string id, UserStatus status)
        {
            return await _employeeRepository.ChangeStatusAsync(id, status);
        }

        public async Task<bool> AssignEmployeeToDepartmentAsync(string employeeId, int departmentId)
        {
            return await _employeeRepository.AssignToDepartmentAsync(employeeId, departmentId);
        }
    }
}