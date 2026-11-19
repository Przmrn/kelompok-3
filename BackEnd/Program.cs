using BackEnd.Data;
using BackEnd.Repositories;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi


var connStr = builder.Configuration.GetConnectionString("Course");
builder.Services.AddDbContext<CourseDbContext>(options =>
    options.UseNpgsql(connStr));

builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

var app = builder.Build();

app.UseHttpsRedirection();

app.Run();