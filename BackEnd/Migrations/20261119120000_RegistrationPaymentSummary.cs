using BackEnd.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace BackEnd.Migrations;

[DbContext(typeof(CourseDbContext))]
[Migration("20261119120000_RegistrationPaymentSummary")]
public class RegistrationPaymentSummary : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "Registrations"
                ADD COLUMN IF NOT EXISTS "PaidAmount" numeric(15,2) NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS "PaidAt" timestamp with time zone;

            UPDATE "Registrations" AS r
            SET "PaidAmount" = CASE WHEN r."PaidAmount" = 0 THEN s.total ELSE r."PaidAmount" END,
                "PaidAt" = COALESCE(r."PaidAt", s.last_payment)
            FROM (
                SELECT "RegistrationId", SUM("PaidAmount") AS total, MAX("PaidAt") AS last_payment
                FROM "InstallmentSchedules" WHERE "PaidAmount" > 0 GROUP BY "RegistrationId"
            ) AS s
            WHERE r."Id" = s."RegistrationId" AND r."PaymentMethod" = 'INSTALLMENT'
                AND (r."PaidAmount" = 0 OR r."PaidAt" IS NULL);

            UPDATE "Registrations" SET "PaidAmount" = "TotalAmount"
            WHERE "PaymentMethod" = 'UPFRONT' AND "PaymentStatus" = 'PAID' AND "PaidAmount" = 0;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
    }
}
