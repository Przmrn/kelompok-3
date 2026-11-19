using System.Text.Json;
using BackEnd.Exceptions;
<<<<<<< HEAD
using OpenTelemetry.Trace;
=======
using Microsoft.EntityFrameworkCore;
>>>>>>> rafie

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
<<<<<<< HEAD
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception pada {Method} {path}",
                    context.Request.Method, context.Request.Path);
                await WriteResponse(context, StatusCodes.Status500InternalServerError,
                    "Terjadi kesalahan server.");
=======
            catch (DbUpdateException ex)
            {
                _logger.LogWarning(ex, "Perubahan data ditolak oleh database.");
                await WriteResponse(context, 409, "Perubahan tidak dapat disimpan. Periksa data terkait.");
>>>>>>> rafie
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

