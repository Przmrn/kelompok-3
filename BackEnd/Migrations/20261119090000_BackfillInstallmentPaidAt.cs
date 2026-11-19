using BackEnd.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace BackEnd.Migrations;

[DbContext(typeof(CourseDbContext))]
[Migration("20261119090000_BackfillInstallmentPaidAt")]
public partial class BackfillInstallmentPaidAt : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            UPDATE "Registrations" AS r
            SET "PaidAt" = payments.last_paid_at
            FROM (
                SELECT "RegistrationId", MAX("PaidAt") AS last_paid_at
                FROM "InstallmentSchedules"
                WHERE "PaidAmount" > 0 AND "PaidAt" IS NOT NULL
                GROUP BY "RegistrationId"
            ) AS payments
            WHERE r."Id" = payments."RegistrationId"
              AND r."PaymentMethod" = 'INSTALLMENT'
              AND r."PaidAt" IS NULL;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
    }
}