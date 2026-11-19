-- =============================================
-- RESET AUTO INCREMENT SEQUENCE
-- SISTEM REGISTRASI KURSUS OFFLINE
-- =============================================

SELECT setval(pg_get_serial_sequence('"Users"', 'Id'), COALESCE((SELECT MAX("Id") FROM "Users"), 1));
SELECT setval(pg_get_serial_sequence('"Students"', 'Id'), COALESCE((SELECT MAX("Id") FROM "Students"), 1));
SELECT setval(pg_get_serial_sequence('"Instructors"', 'Id'), COALESCE((SELECT MAX("Id") FROM "Instructors"), 1));
SELECT setval(pg_get_serial_sequence('"Locations"', 'Id'), COALESCE((SELECT MAX("Id") FROM "Locations"), 1));
SELECT setval(pg_get_serial_sequence('"CourseCategories"', 'Id'), COALESCE((SELECT MAX("Id") FROM "CourseCategories"), 1));
SELECT setval(pg_get_serial_sequence('"Courses"', 'Id'), COALESCE((SELECT MAX("Id") FROM "Courses"), 1));
SELECT setval(pg_get_serial_sequence('"CourseBatches"', 'Id'), COALESCE((SELECT MAX("Id") FROM "CourseBatches"), 1));
SELECT setval(pg_get_serial_sequence('"BatchInstructors"', 'Id'), COALESCE((SELECT MAX("Id") FROM "BatchInstructors"), 1));
SELECT setval(pg_get_serial_sequence('"Registrations"', 'Id'), COALESCE((SELECT MAX("Id") FROM "Registrations"), 1));
SELECT setval(pg_get_serial_sequence('"InstallmentSchedules"', 'Id'), COALESCE((SELECT MAX("Id") FROM "InstallmentSchedules"), 1));