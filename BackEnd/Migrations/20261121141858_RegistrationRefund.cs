using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackEnd.Migrations
{
    /// <inheritdoc />
    public partial class RegistrationRefund : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CancellationReason",
                table: "Registrations",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CancelledAt",
                table: "Registrations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DaysBeforeBatchStart",
                table: "Registrations",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "RefundAmount",
                table: "Registrations",
                type: "numeric(15,2)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RefundPercentage",
                table: "Registrations",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RefundReference",
                table: "Registrations",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RefundedAt",
                table: "Registrations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "RefundedByUserId",
                table: "Registrations",
                type: "bigint",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CancellationReason",
                table: "Registrations");

            migrationBuilder.DropColumn(
                name: "CancelledAt",
                table: "Registrations");

            migrationBuilder.DropColumn(
                name: "DaysBeforeBatchStart",
                table: "Registrations");

            migrationBuilder.DropColumn(
                name: "RefundAmount",
                table: "Registrations");

            migrationBuilder.DropColumn(
                name: "RefundPercentage",
                table: "Registrations");

            migrationBuilder.DropColumn(
                name: "RefundReference",
                table: "Registrations");

            migrationBuilder.DropColumn(
                name: "RefundedAt",
                table: "Registrations");

            migrationBuilder.DropColumn(
                name: "RefundedByUserId",
                table: "Registrations");
        }
    }
}
