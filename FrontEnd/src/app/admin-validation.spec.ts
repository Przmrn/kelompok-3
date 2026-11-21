import { batchError, courseError } from './admin-validation';

describe('Validasi data admin', () => {
  const batch = { courseId: 6, locationId: 7, batchName: 'Kelas A', startDate: '2027-01-01', endDate: '2027-02-01', startTime: '09:00', endTime: '11:00', maxSeats: 20 };
  it('menerima ID referensi nyata dan menolak referensi yang sudah dihapus', () => {
    expect(batchError(batch, [6], [7])).toBe('');
    expect(batchError({ ...batch, courseId: 1 }, [6], [7])).toContain('kelas');
    expect(batchError(batch, [6], [])).toContain('lokasi');
  });
  it('menolak tanggal, jam, dan kapasitas yang tidak valid', () => {
    expect(batchError({ ...batch, startDate: '2027-02-30' }, [6], [7])).toContain('tanggal');
    expect(batchError({ ...batch, startDate: '2028-01-01' }, [6], [7])).toContain('Tanggal selesai');
    expect(batchError({ ...batch, endTime: '09:00' }, [6], [7])).toContain('Jam selesai');
    for (const maxSeats of [0, 31, 2.5]) expect(batchError({ ...batch, maxSeats }, [6], [7])).toContain('Kapasitas');
    expect(batchError(batch, [6], [7], 21)).toContain('peserta terdaftar');
  });
  it('menolak harga, durasi, dan materi kelas yang tidak valid', () => {
    const course = { categoryId: 5, syllabus: 'SQL', durationHours: 8, basePrice: 5000 };
    expect(courseError(course, [5])).toBe('');
    for (const basePrice of [0, -1, NaN]) expect(courseError({ ...course, basePrice }, [5])).toContain('Harga');
    expect(courseError({ ...course, durationHours: 0.5 }, [5])).toContain('Durasi');
    expect(courseError({ ...course, syllabus: '  ' }, [5])).toContain('materi');
  });
});
