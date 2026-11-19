
-- =====================================================
-- SCRIPT SQL DATA UJI
-- SISTEM REGISTRASI KURSUS OFFLINE
-- =====================================================
-- Jalankan manual melalui pgAdmin / psql
-- Setelah dotnet ef database update selesai.
-- Jangan masukkan ke dalam migration atau OnModelCreating.
-- =====================================================


-- =============================================
-- 1. USERS
-- =============================================
INSERT INTO "Users" ("Id", "FullName", "Email", "Password", "Role") VALUES
(1, 'Budi Santoso', 'budi@gmail.com', 'Budi@2026!', 'STUDENT'),
(2, 'Siti Aminah', 'siti@gmail.com', 'Siti@2026!', 'STUDENT'),
(3, 'Andi Wijaya', 'andi@kursus.com', 'Andi@2026!', 'INSTRUCTOR'),
(4, 'Dewi Lestari', 'dewi@kursus.com', 'Dewi@2026!', 'INSTRUCTOR'),
(5, 'Admin Utama', 'admin@kursus.com', 'Admin@2026!', 'ADMIN');


-- =============================================
-- 2. STUDENTS
-- =============================================
INSERT INTO "Students"
("Id", "UserId", "FullName", "PhoneNumber", "Address", "City", "Province", "Country", "EducationalLevel", "Occupation")
VALUES
(1, 1, 'Budi Santoso', '081234567801', 'Jl. Melati No. 10', 'Jakarta', 'DKI Jakarta', 'Indonesia', 'S1', 'Mahasiswa'),
(2, 2, 'Siti Aminah', '081234567802', 'Jl. Mawar No. 20', 'Bandung', 'Jawa Barat', 'Indonesia', 'SMA', 'Pelajar');


-- =============================================
-- 3. INSTRUCTORS
-- =============================================
INSERT INTO "Instructors"
("Id", "UserId", "FullName", "Expertise", "Bio", "Email", "PhoneNumber")
VALUES
(1, 3, 'Andi Wijaya', 'Backend Development', 'Berpengalaman dalam pengembangan aplikasi backend menggunakan C# dan ASP.NET Core.', 'andi@kursus.com', '081234567803'),
(2, 4, 'Dewi Lestari', 'Data Science', 'Berpengalaman dalam Python, Machine Learning, dan Data Analytics.', 'dewi@kursus.com', '081234567804');


-- =============================================
-- 4. LOCATIONS
-- =============================================
INSERT INTO "Locations" ("Id", "Name", "Address", "City", "RoomName")
VALUES
(1, 'Kampus Jakarta', 'Jl. Sudirman No. 10', 'Jakarta', 'Lab Komputer A'),
(2, 'Kampus Bandung', 'Jl. Asia Afrika No. 20', 'Bandung', 'Lab Komputer B');


-- =============================================
-- 5. COURSE CATEGORIES
-- =============================================
INSERT INTO "CourseCategories" ("Id", "Name", "Description")
VALUES
(1, 'Programming', 'Pelatihan pemrograman dan software development'),
(2, 'Data Science', 'Pelatihan pengolahan dan analisis data'),
(3, 'Web Development', 'Pelatihan pengembangan aplikasi web');


-- =============================================
-- 6. COURSES
-- =============================================
INSERT INTO "Courses" ("Id", "CategoryId", "Syllabus", "DurationHours", "BasePrice")
VALUES
(1, 1, 'C#, OOP, LINQ, Entity Framework Core, ASP.NET Core Web API', 40, 2500000),
(2, 2, 'Python, Pandas, NumPy, Data Visualization, Machine Learning', 48, 3000000),
(3, 3, 'HTML, CSS, JavaScript, Angular, REST API', 60, 3500000);


-- =============================================
-- 7. COURSE BATCHES
-- =============================================
INSERT INTO "CourseBatches"
("Id", "CourseId", "LocationId", "BatchName", "StartDate", "EndDate", "StartTime", "EndTime", "MaxSeats", "CourseStatus")
VALUES
(1, 1, 1, 'Backend .NET Batch 1', '2026-12-01', '2027-01-15', '09:00', '12:00', 25, 'OPEN'),
(2, 2, 2, 'Data Science Batch 1', '2026-12-05', '2027-01-20', '13:00', '16:00', 20, 'OPEN'),
(3, 3, 1, 'Web Development Batch 1', '2027-01-05', '2027-02-28', '09:00', '12:00', 30, 'OPEN');


-- =============================================
-- 8. BATCH INSTRUCTORS
-- =============================================
INSERT INTO "BatchInstructors" ("Id", "BatchId", "InstructorId")
VALUES
(1, 1, 1),
(2, 2, 2),
(3, 3, 1);


-- =============================================
-- 9. REGISTRATIONS
-- =============================================
INSERT INTO "Registrations"
("Id", "StudentId", "BatchId", "RegistrationNumber", "RegistrationDate",
 "QueueNumber", "BasePrice", "EarlyBirdDiscount", "TaxRate", "TaxAmount",
 "TotalAmount", "PaymentMethod", "InstallmentTenor", "PaymentStatus", "RegistrationStatus")
VALUES

-- Budi mendaftar Backend .NET
(1, 1, 1, 'REG-2026-001', '2026-11-18 09:00:00',
 1, 2500000, 250000, 11.00, 247500,
 2497500, 'TRANSFER', 2, 'PENDING', 'CONFIRMED'),

-- Siti mendaftar Data Science
(2, 2, 2, 'REG-2026-002', '2026-11-18 10:00:00',
 1, 3000000, 0, 11.00, 330000,
 3330000, 'CASH', NULL, 'PAID', 'CONFIRMED'),

-- Budi mendaftar Web Development
(3, 1, 3, 'REG-2026-003', '2026-11-18 11:00:00',
 1, 3500000, 350000, 11.00, 346500,
 3496500, 'TRANSFER', 2, 'PENDING', 'PENDING');


-- =============================================
-- 10. INSTALLMENT SCHEDULES
-- =============================================
INSERT INTO "InstallmentSchedules"
("Id", "RegistrationId", "InstallmentNumber", "DueDate", "Amount", "PaidAt", "PaidAmount", "InstallmentStatus")
VALUES

-- Cicilan Budi: Backend .NET
(1, 1, 1, '2026-11-25', 1248750, NULL, 0, 'PENDING'),
(2, 1, 2, '2026-12-25', 1248750, NULL, 0, 'PENDING'),

-- Pembayaran Siti: Data Science
(3, 2, 1, '2026-11-25', 3330000, '2026-11-18 14:00:00', 3330000, 'PAID'),

-- Cicilan Budi: Web Development
(4, 3, 1, '2026-12-01', 1748250, NULL, 0, 'PENDING'),
(5, 3, 2, '2027-01-01', 1748250, NULL, 0, 'PENDING');


-- =============================================
-- 11. RESET AUTO INCREMENT SEQUENCE
-- =============================================
SELECT setval(pg_get_serial_sequence('"Users"', 'Id'), (SELECT MAX("Id") FROM "Users"));
SELECT setval(pg_get_serial_sequence('"Students"', 'Id'), (SELECT MAX("Id") FROM "Students"));
SELECT setval(pg_get_serial_sequence('"Instructors"', 'Id'), (SELECT MAX("Id") FROM "Instructors"));
SELECT setval(pg_get_serial_sequence('"Locations"', 'Id'), (SELECT MAX("Id") FROM "Locations"));
SELECT setval(pg_get_serial_sequence('"CourseCategories"', 'Id'), (SELECT MAX("Id") FROM "CourseCategories"));
SELECT setval(pg_get_serial_sequence('"Courses"', 'Id'), (SELECT MAX("Id") FROM "Courses"));
SELECT setval(pg_get_serial_sequence('"CourseBatches"', 'Id'), (SELECT MAX("Id") FROM "CourseBatches"));
SELECT setval(pg_get_serial_sequence('"BatchInstructors"', 'Id'), (SELECT MAX("Id") FROM "BatchInstructors"));
SELECT setval(pg_get_serial_sequence('"Registrations"', 'Id'), (SELECT MAX("Id") FROM "Registrations"));
SELECT setval(pg_get_serial_sequence('"InstallmentSchedules"', 'Id'), (SELECT MAX("Id") FROM "InstallmentSchedules"));