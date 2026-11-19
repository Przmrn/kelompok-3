
using BackEnd.Models;
using BackEnd.Repositories;

namespace BackEnd.Services
{
    public class BatchInstructorService : IBatchInstructorService
    {
        private readonly IRepository<BatchInstructor> _batchInstructorRepository;
        private readonly IRepository<CourseBatch> _courseBatchRepository;
        private readonly IRepository<Instructor> _instructorRepository;

        public BatchInstructorService(
            IRepository<BatchInstructor> batchInstructorRepository,
            IRepository<CourseBatch> courseBatchRepository,
            IRepository<Instructor> instructorRepository)
        {
            _batchInstructorRepository = batchInstructorRepository;
            _courseBatchRepository = courseBatchRepository;
            _instructorRepository = instructorRepository;
        }

        // Mengambil seluruh penugasan instruktur
        public async Task<IEnumerable<BatchInstructor>> GetAllAsync()
        {
            return await _batchInstructorRepository.GetAllAsync(
                "Instructor,CourseBatch");
        }

        // Mengambil seluruh instruktur yang ditugaskan pada batch tertentu
        public async Task<IEnumerable<BatchInstructor>> GetByBatchIdAsync(long batchId)
        {
            var assignments = await _batchInstructorRepository.GetAllAsync(
                "Instructor,CourseBatch");

            return assignments.Where(bi => bi.BatchId == batchId);
        }

        // Mengambil seluruh batch yang diajar oleh instruktur tertentu
        public async Task<IEnumerable<BatchInstructor>> GetByInstructorIdAsync(long instructorId)
        {
            var assignments = await _batchInstructorRepository.GetAllAsync(
                "Instructor,CourseBatch");

            return assignments.Where(bi => bi.InstructorId == instructorId);
        }

        // Menugaskan instruktur ke batch
        public async Task<BatchInstructor> AssignInstructorAsync(
            long batchId,
            long instructorId)
        {
            // 1. Pastikan batch tersedia
            var courseBatch = await _courseBatchRepository.GetByIdAsync(batchId);

            if (courseBatch == null)
                throw new BackEnd.Exceptions.AppException("Batch tidak ditemukan.");

            // 2. Pastikan instruktur tersedia
            var instructorExists = await _instructorRepository.ExistsAsync(
                i => i.Id == instructorId);

            if (!instructorExists)
                throw new BackEnd.Exceptions.AppException("Instruktur tidak ditemukan.");

            // 3. Periksa apakah instruktur sudah ditugaskan ke batch ini
            var alreadyAssigned = await _batchInstructorRepository.ExistsAsync(
                bi => bi.BatchId == batchId &&
                      bi.InstructorId == instructorId);

            if (alreadyAssigned)
                throw new BackEnd.Exceptions.AppException("Instruktur sudah ditugaskan ke batch ini.");

            // 4. Ambil seluruh batch yang diajar instruktur tersebut
            var assignments = await _batchInstructorRepository.GetAllAsync(
                "CourseBatch");

            var instructorAssignments = assignments
                .Where(bi => bi.InstructorId == instructorId);

            // 5. Periksa bentrok jadwal
            foreach (var assignment in instructorAssignments)
            {
                var existingBatch = assignment.CourseBatch;

                // Periksa apakah rentang tanggal bertumpang tindih
                bool dateOverlap =
                    existingBatch.StartDate <= courseBatch.EndDate &&
                    existingBatch.EndDate >= courseBatch.StartDate;

                // Periksa apakah rentang waktu bertumpang tindih
                bool timeOverlap =
                    existingBatch.StartTime < courseBatch.EndTime &&
                    existingBatch.EndTime > courseBatch.StartTime;

                if (dateOverlap && timeOverlap)
                {
                    throw new BackEnd.Exceptions.AppException(
                        "Instruktur sudah memiliki jadwal mengajar yang bentrok.");
                }
            }

            // 6. Buat penugasan baru
            var batchInstructor = new BatchInstructor
            {
                BatchId = batchId,
                InstructorId = instructorId
            };

            await _batchInstructorRepository.AddAsync(batchInstructor);
            await _batchInstructorRepository.SaveChangesAsync();

            return batchInstructor;
        }

        // Menghapus penugasan instruktur dari batch
        public async Task<bool> RemoveInstructorAsync(
            long batchId,
            long instructorId)
        {
            var assignment = await _batchInstructorRepository.FindAsync(
                bi => bi.BatchId == batchId &&
                      bi.InstructorId == instructorId);

            var existingAssignment = assignment.FirstOrDefault();

            if (existingAssignment == null)
                return false;

            _batchInstructorRepository.Delete(existingAssignment);
            await _batchInstructorRepository.SaveChangesAsync();

            return true;
        }
    }
}
