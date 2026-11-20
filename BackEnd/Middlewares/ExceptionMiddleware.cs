using System.Text.Json;
using BackEnd.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace BackEnd.Middlewares
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;

        public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (AppException ex)
            {
                await WriteResponse(context, ex.StatusCode, ex.Message);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogWarning(ex, "Perubahan data ditolak oleh database.");
                await WriteResponse(context, StatusCodes.Status409Conflict,
                    "Perubahan tidak dapat disimpan. Periksa data terkait.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception pada {Method} {Path}",
                    context.Request.Method, context.Request.Path);
                await WriteResponse(context, StatusCodes.Status500InternalServerError,
                    "Terjadi kesalahan server.");
            }
        }

        private static Task WriteResponse(HttpContext context, int statusCode, string message)
        {
            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/json";
            var body = JsonSerializer.Serialize(new { status = statusCode, message });
            return context.Response.WriteAsync(body);
        }
    }
}

