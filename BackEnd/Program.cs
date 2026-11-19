using BackEnd.Data;
using BackEnd.Middlewares;
using BackEnd.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi


var connStr = builder.Configuration.GetConnectionString("Course");
builder.Services.AddDbContext<CourseDbContext>(options =>
    options.UseNpgsql(connStr));

builder.Services.AddControllers();
builder.Services.AddSwaggerGen();

builder.Services.AddScoped<ICourseService, CourseService>();
builder.Services.AddScoped<ILocationService, LocationService>();
builder.Services.AddScoped<IStudentService, StudentService>();
builder.Services.AddScoped<IInstructorService, InstructorService>();

var app = builder.Build();

app.UseMiddleware<ExceptionMiddleware>();
//app.UseCors("AllowAngular");
app.UseHttpsRedirection();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();

app.Run();
