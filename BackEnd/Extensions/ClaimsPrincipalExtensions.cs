using BackEnd.Exceptions;
using System.Security.Claims;

namespace BackEnd.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        public static long GetUserId(this ClaimsPrincipal user)
        {
            var value = user.FindFirst("sub")?.Value
                        ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!long.TryParse(value, out var id))
                throw new UnauthorizedException("Token tidak valid.");

            return id;
        }

    }
}
