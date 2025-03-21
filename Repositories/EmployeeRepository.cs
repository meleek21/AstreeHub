using ASTREE_PFE.Data;
using ASTREE_PFE.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ASTREE_PFE.Repositories
{
    public class EmployeeRepository : IEmployeeRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<Employee> _userManager;

        public EmployeeRepository(ApplicationDbContext context, UserManager<Employee> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        public async Task<IEnumerable<Employee>> GetAllAsync()
        {
            return await _userManager.Users.ToListAsync();
        }

        public async Task<Employee> GetByIdAsync(string id)
        {
            return await _userManager.FindByIdAsync(id);
        }

        public async Task<IEnumerable<Employee>> GetByDepartmentAsync(int departmentId)
        {
            return await _context.Users
                .Where(e => e.DepartmentId == departmentId)
                .ToListAsync();
        }

        public async Task<bool> CreateAsync(Employee employee, string password)
        {
            var result = await _userManager.CreateAsync(employee, password);
            if (result.Succeeded)
            {
                await _userManager.AddToRoleAsync(employee, employee.Role.ToString());
                
                // If the employee is a Director and has a department assigned, update the department's DirectorId
                if (employee.Role == RoleType.DIRECTOR && employee.DepartmentId.HasValue)
                {
                    var department = await _context.Departments.FindAsync(employee.DepartmentId.Value);
                    if (department != null)
                    {
                        department.DirectorId = employee.Id;
                        await _context.SaveChangesAsync();
                    }
                }
                
                return true;
            }
            return false;
        }

        public async Task<bool> UpdateAsync(string id, Employee employeeUpdate)
        {
            var employee = await _userManager.FindByIdAsync(id);
            if (employee == null)
                return false;

            employee.FirstName = employeeUpdate.FirstName;
            employee.LastName = employeeUpdate.LastName;
            employee.Email = employeeUpdate.Email;
            employee.PhoneNumber = employeeUpdate.PhoneNumber;
            employee.DateOfBirth = employeeUpdate.DateOfBirth;
            employee.DepartmentId = employeeUpdate.DepartmentId;

            // If role is changing, update role
            if (employee.Role != employeeUpdate.Role)
            {
                var currentRoles = await _userManager.GetRolesAsync(employee);
                await _userManager.RemoveFromRolesAsync(employee, currentRoles);
                await _userManager.AddToRoleAsync(employee, employeeUpdate.Role.ToString());

                // If the employee was a Director, remove their DirectorId from the department
                if (employee.Role == RoleType.DIRECTOR && employee.DepartmentId.HasValue)
                {
                    var oldDepartment = await _context.Departments.FindAsync(employee.DepartmentId.Value);
                    if (oldDepartment != null && oldDepartment.DirectorId == employee.Id)
                    {
                        oldDepartment.DirectorId = null;
                        await _context.SaveChangesAsync();
                    }
                }

                employee.Role = employeeUpdate.Role;

                // If the employee is becoming a Director and has a department assigned, update the department's DirectorId
                if (employeeUpdate.Role == RoleType.DIRECTOR && employeeUpdate.DepartmentId.HasValue)
                {
                    var department = await _context.Departments.FindAsync(employeeUpdate.DepartmentId.Value);
                    if (department != null)
                    {
                        department.DirectorId = employee.Id;
                        await _context.SaveChangesAsync();
                    }
                }
            }

            var result = await _userManager.UpdateAsync(employee);
            return result.Succeeded;
        }

        public async Task<bool> DeleteAsync(string id)
        {
            var employee = await _userManager.FindByIdAsync(id);
            if (employee == null)
                return false;

            var result = await _userManager.DeleteAsync(employee);
            return result.Succeeded;
        }

        public async Task<bool> ChangeStatusAsync(string id, UserStatus status)
        {
            var employee = await _userManager.FindByIdAsync(id);
            if (employee == null)
                return false;

            employee.Status = status;
            var result = await _userManager.UpdateAsync(employee);
            return result.Succeeded;
        }

        public async Task<bool> AssignToDepartmentAsync(string employeeId, int departmentId)
        {
            var employee = await _userManager.FindByIdAsync(employeeId);
            if (employee == null)
                return false;

            var department = await _context.Departments.FindAsync(departmentId);
            if (department == null)
                return false;

            employee.DepartmentId = departmentId;
            var result = await _userManager.UpdateAsync(employee);
            return result.Succeeded;
        }
    }
}