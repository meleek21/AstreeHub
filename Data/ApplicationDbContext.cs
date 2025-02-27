using ASTREE_PFE.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ASTREE_PFE.Data
{
    public class ApplicationDbContext : IdentityDbContext<Employee>
    {
        public DbSet<Department> Departments { get; set; }

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure relationships
            builder.Entity<Employee>()
        .HasOne(e => e.Department)
        .WithMany(d => d.Members)
        .HasForeignKey(e => e.DepartmentId);

            builder.Entity<Department>()
                .HasOne(d => d.Director)
                .WithMany()
                .HasForeignKey(d => d.DirectorId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }

}
