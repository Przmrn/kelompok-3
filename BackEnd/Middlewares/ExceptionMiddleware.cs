using System.Text.Json;
using BackEnd.Exceptions;
<<<<<<<<< Temporary merge branch 1
using OpenTelemetry.Trace;
=========
using Microsoft.EntityFrameworkCore;
>>>>>>>>> Temporary merge branch 2

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
<<<<<<<<< Temporary merge branch 1
                _logger.LogError(ex, "Unhandled exception pada {Method} {path}",
                    context.Request.Method, context.Request.Path);
                await WriteResponse(context, StatusCodes.Status500InternalServerError,
                    "Terjadi kesalahan server.");
=========
                await WriteResponse(context, ex.StatusCode, ex.Message);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogWarning(ex, "Perubahan data ditolak oleh database.");
                await WriteResponse(context, 409, "Perubahan tidak dapat disimpan. Periksa data terkait.");
>>>>>>>>> Temporary merge branch 2
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

