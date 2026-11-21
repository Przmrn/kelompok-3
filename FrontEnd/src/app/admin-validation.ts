export function courseError(form: { categoryId: number; syllabus: string; durationHours: number; basePrice: number }, categoryIds: number[]): string {
  if (!categoryIds.includes(form.categoryId)) return 'Pilih kategori kelas yang tersedia.';
  if (!form.syllabus?.trim()) return 'Isi materi kelas.';
  if (!Number.isInteger(form.durationHours) || form.durationHours < 1 || form.durationHours > 2147483647) return 'Durasi harus berupa jumlah jam bulat lebih dari nol.';
  if (!Number.isFinite(form.basePrice) || form.basePrice < 0.01 || form.basePrice > 9999999999999.99) return 'Harga kelas harus lebih dari nol dan maksimal Rp9.999.999.999.999,99.';
  return '';
}

export function batchError(form: { courseId: number; locationId: number; batchName: string; startDate: string; endDate: string; startTime: string; endTime: string; maxSeats: number }, courseIds: number[], locationIds: number[], usedSeats = 0): string {
  if (!courseIds.includes(form.courseId)) return 'Pilih kelas yang tersedia.';
  if (!locationIds.includes(form.locationId)) return 'Pilih lokasi yang tersedia.';
  if (!form.batchName?.trim() || form.batchName.trim().length > 150) return 'Nama jadwal wajib diisi, maksimal 150 karakter.';
  const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if (!validDate(form.startDate) || !validDate(form.endDate)) return 'Isi tanggal mulai dan selesai yang valid.';
  if (form.startDate > form.endDate) return 'Tanggal selesai tidak boleh sebelum tanggal mulai.';
  if (![form.startTime, form.endTime].every(value => /^([01]\d|2[0-3]):[0-5]\d$/.test(value))) return 'Isi jam mulai dan selesai yang valid.';
  if (form.startTime >= form.endTime) return 'Jam selesai harus setelah jam mulai.';
  if (!Number.isInteger(form.maxSeats) || form.maxSeats < 1 || form.maxSeats > 30) return 'Kapasitas harus berupa bilangan bulat antara 1 dan 30.';
  if (form.maxSeats < usedSeats) return 'Kapasitas tidak boleh kurang dari jumlah peserta terdaftar.';
  return '';
}
