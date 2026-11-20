using System.Security.Claims;
using System.Text.Json;
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
            catch (BackEnd.Exceptions.AppException ex)
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

namespace BackEnd.Exceptions
{
    public class AppException : Exception
    {
        public int StatusCode { get; }

        public AppException(string message, int statusCode = 400) : base(message)
        {
            StatusCode = statusCode;
        }
    }

    public class NotFoundException : AppException
    {
        public NotFoundException(string message) : base(message, 404) { }
    }

    public class UnauthorizedException : AppException
    {
        public UnauthorizedException(string message) : base(message, 401) { }
    }
}

namespace BackEnd.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        public static long GetUserId(this ClaimsPrincipal user)
        {
            var value = user.FindFirst("sub")?.Value
                        ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!long.TryParse(value, out var id))
                throw new BackEnd.Exceptions.UnauthorizedException("Token tidak valid.");

            return id;
        }
    }
}

