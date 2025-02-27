using ASTREE_PFE.Data;
using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories;
using ASTREE_PFE.Services;
using ASTREE_PFE.Services.Interfaces;
// Remove the Hubs reference until we create it
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using CloudinaryDotNet;
using System.Text.Json.Serialization;
using System.Text.Json;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Configure Cloudinary
var cloudinarySettings = builder.Configuration.GetSection("Cloudinary").Get<CloudinarySettings>();
var cloudinary = new Cloudinary(new Account(
    cloudinarySettings.CloudName,
    cloudinarySettings.ApiKey,
    cloudinarySettings.ApiSecret
));
builder.Services.AddSingleton(cloudinary);

// Configure MongoDB
var mongoConnectionString = builder.Configuration.GetConnectionString("MongoConnection");
var mongoDatabase = builder.Configuration.GetConnectionString("MongoDatabase");
var mongoClient = new MongoClient(mongoConnectionString);
var database = mongoClient.GetDatabase(mongoDatabase);
builder.Services.AddSingleton<IMongoDatabase>(database);

// Register MongoDB repositories with collection names
builder.Services.AddScoped<IMongoRepository<Comment>>(sp => 
    new MongoRepository<Comment>(sp.GetRequiredService<IMongoDatabase>(), "Comments"));
    
builder.Services.AddScoped<IMongoRepository<Post>>(sp => 
    new MongoRepository<Post>(sp.GetRequiredService<IMongoDatabase>(), "Posts"));
    
builder.Services.AddScoped<IMongoRepository<Notification>>(sp => 
    new MongoRepository<Notification>(sp.GetRequiredService<IMongoDatabase>(), "Notifications"));

// Register Repositories
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IPostRepository, PostRepository>();
builder.Services.AddScoped<ICommentRepository, CommentRepository>();
builder.Services.AddScoped<IEmployeeRepository, EmployeeRepository>();
builder.Services.AddScoped<IDepartmentRepository, DepartmentRepository>();

// Add DbContext with SQL Server
var sqlConnectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(sqlConnectionString));

// Add JWT Configuration
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    var jwtSecret = builder.Configuration["JWT:Secret"] ?? 
        throw new InvalidOperationException("JWT:Secret configuration is missing");
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["JWT:ValidIssuer"],
        ValidAudience = builder.Configuration["JWT:ValidAudience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["JWT:Secret"]!))
    };
});

// Add Identity Configuration
builder.Services.AddIdentity<Employee, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredLength = 8;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Register AuthService
builder.Services.AddScoped<IAuthService, AuthService>();

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register Services
builder.Services.AddScoped<ICloudinaryService, CloudinaryService>();
builder.Services.AddScoped<IPostService, PostService>();
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<IDepartmentService, DepartmentService>();

// Add SignalR
builder.Services.AddSignalR();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        builder => builder
            .WithOrigins("http://localhost:5173")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

var app = builder.Build();

// Create roles
using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var roles = new[] { "ADMIN", "USER", "EMPLOYEE", "DIRECTOR", "SUPER_ADMIN" }; // Added SUPER_ADMIN
    
    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(new IdentityRole(role));
        }
    }

    // Seed initial data
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<Employee>>();

    // Check if the Departments table is empty
    if (!dbContext.Departments.Any())
    {
        // Create an employee
        var employee = new Employee
        {
            FirstName = "Admin",
            LastName = "User",
            Email = "admin@example.com",
            Role = RoleType.SUPER_ADMIN,
            Status = UserStatus.Active,
            DateOfBirth = new DateTime(1990, 1, 1)
        };

        var result = await userManager.CreateAsync(employee, "Admin123!");
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(employee, employee.Role.ToString());

            // Create a department with the employee as the director
            var department = new Department
            {
                Name = "HR",
                Description = "Human Resources Department",
                DirectorId = employee.Id
            };

            dbContext.Departments.Add(department);
            dbContext.SaveChanges();
        }
    }
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowReactApp");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
// Comment out the hub mapping until we create the hub
// app.MapHub<NotificationHub>("/hubs/notification");

app.Run();