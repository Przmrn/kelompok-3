import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { User } from '../models/course-system.models';
import { AuthService } from './auth.service';
import { accountId, flushCourseData, flushInstructorAssignments, instructor, student } from './course-api.testing';
import { CourseSystemService } from './course-system.service';

describe('Sinkronisasi data kelas', () => {
  const user = signal<User | null>(null);
  let service: CourseSystemService;
  let http: HttpTestingController;

  beforeEach(() => {
    user.set({ id: accountId, fullName: 'Peserta', role: 'Student', email: 'peserta@example.test' });
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: { user } },
    ] });
    service = TestBed.inject(CourseSystemService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('menampilkan kelas dan jadwal kepada tamu hanya dari endpoint publik', async () => {
    user.set(null);
    TestBed.flushEffects();
    const loading = service.reload();
    flushCourseData('Guest');
    http.expectNone('/api/BatchInstructor');
    await loading;
    expect(service.loadError()).toBe('');
    expect(service.getCourseById(6)?.title).toContain('Backend');
    expect(service.getBatchesByCourseId(6)[0].id).toBe(9);
  });

  for (const role of ['Student', 'Admin'] as const) {
    it(`memuat pendaftaran dan cicilan untuk ${role}`, async () => {
      user.set({ ...user()!, role });
      TestBed.flushEffects();
      if (role === 'Student') http.expectOne('/api/students/me').flush(student);
      const loading = service.reload();
      flushCourseData(role);
      await loading;
      expect(service.accountError()).toBe('');
      expect(service.registrations().length).toBe(3);
      expect(service.installmentSchedules().map(s => [s.registrationId, s.id, s.status]))
        .toEqual([[1, 20, 'Paid'], [3, 30, 'Pending']]);
      expect(service.getInstructorsForBatch(9)[0].instructor.fullName).toBe(instructor.fullName);
    });
  }

  it('menyembunyikan aktivitas pembayaran berstatus Cancelled dan Completed', async () => {
    TestBed.flushEffects();
    http.expectOne('/api/students/me').flush(student);
    const loading = service.reload();
    flushCourseData('Student', {
      phone: '',
      expertise: instructor.expertise,
      cancelled: false,
      statusOverrides: { 1: 'COMPLETED', 2: 'CANCELLED' },
    });
    await loading;
    expect(service.myRegistrations().length).toBe(3);
    expect(service.paymentActivities().map(r => r.id)).toEqual([3]);
  });

  it('menyembunyikan pendaftaran final dari daftar dashboard admin', async () => {
    user.set({ ...user()!, role: 'Admin' });
    TestBed.flushEffects();
    const loading = service.reload();
    flushCourseData('Admin', {
      phone: '',
      expertise: instructor.expertise,
      cancelled: false,
      statusOverrides: { 1: 'COMPLETED', 2: 'CANCELLED' },
    });
    await loading;
    expect(service.registrations().length).toBe(3);
    expect(service.adminRegistrations().map(r => r.id)).toEqual([3]);
  });

  it('mengeluarkan aktivitas final dari keranjang meskipun pembayarannya belum lunas', async () => {
    TestBed.flushEffects();
    http.expectOne('/api/students/me').flush(student);
    const loading = service.reload();
    flushCourseData('Student', {
      phone: '',
      expertise: instructor.expertise,
      cancelled: false,
      statusOverrides: { 3: 'COMPLETED' },
    });
    await loading;
    expect(service.unpaidCartRegistrations().map(r => r.id)).toEqual([2]);
  });

  it('memuat jadwal berdasarkan profil pengajar yang masuk', async () => {
    user.set({ ...user()!, id: instructor.userId, role: 'Instructor' });
    const loading = service.reload();
    flushCourseData('Guest');
    flushInstructorAssignments();
    http.expectOne('/api/instructors/me').flush(instructor);
    await loading;
    expect(service.accountError()).toBe('');
    const profile = service.getLoggedInInstructorProfile()!;
    expect(profile.id).toBe(instructor.id);
    expect(service.getBatchesForInstructor(profile.id)[0].batch.id).toBe(9);
  });

  it('tetap menampilkan katalog ketika profil peserta gagal dimuat', async () => {
    const loading = service.reload();
    TestBed.flushEffects();
    http.expectOne('/api/Registration/me').flush([]);
    http.expectOne('/api/students/me').flush({}, { status: 401, statusText: 'Unauthorized' });
    flushInstructorAssignments();
    flushCourseData('Guest');
    await loading;
    expect(service.courses().length).toBe(1);
    expect(service.loadError()).toBe('');
    expect(service.loading()).toBeFalse();
    expect(service.accountError()).toBe('');
    expect(service.profileStatus()).toBe('error');
    expect(service.accountLoading()).toBeFalse();
  });

  it('mempertahankan pendaftaran ketika server menolak pembatalan', async () => {
    const loading = service.reload();
    flushCourseData('Student');
    await loading;
    TestBed.flushEffects();
    http.expectOne('/api/students/me').flush(student);
    const result = service.confirmCancelRegistration(1);
    http.expectOne('/api/Registration/1').flush({ message: 'Pendaftaran sudah diproses.' }, { status: 409, statusText: 'Conflict' });
    expect((await result).success).toBeFalse();
    expect(service.registrations()[0].registrationStatus).toBe('Confirmed');
    expect(service.notification()?.message).toBe('Pendaftaran sudah diproses.');
  });

  it('mengabaikan respons milik peserta setelah pengguna keluar', async () => {
    const loading = service.reload();
    user.set(null);
    flushCourseData('Student');
    await loading;
    expect(service.registrations()).toEqual([]);
    expect(service.students()).toEqual([]);
  });

  it('menampilkan alasan dari server dan mempertahankan jadwal yang memiliki riwayat pendaftaran', async () => {
    user.set({ ...user()!, role: 'Admin' });
    const loading = service.reload();
    flushCourseData('Admin');
    await loading;
    const batch = service.batches()[0];
    const reason = 'Jadwal ini sudah memiliki riwayat pendaftaran peserta sehingga tidak dapat dihapus.';
    const result = service.deleteBatchByAdmin(batch);
    http.expectOne({ method: 'DELETE', url: '/api/CourseBatch/9' })
      .flush({ message: reason }, { status: 409, statusText: 'Conflict' });
    expect((await result).success).toBeFalse();
    expect(service.getBatchById(batch.id)).toEqual(batch);
    expect(service.notification()).toEqual({
      type: 'warning', title: 'Jadwal “Grup B” tidak dapat dihapus', message: reason,
    });
  });

  it('memuat ulang daftar setelah server menghapus jadwal kosong', async () => {
    user.set({ ...user()!, role: 'Admin' });
    const loading = service.reload();
    flushCourseData('Admin');
    await loading;
    const emptyBatch = { ...service.batches()[0], id: 10, batchName: 'Grup C', usedSeats: 0 };
    service.batches.update(batches => [...batches, emptyBatch]);
    const result = service.deleteBatchByAdmin(emptyBatch);
    http.expectOne({ method: 'DELETE', url: '/api/CourseBatch/10' }).flush({ message: 'Batch kursus berhasil dihapus.' });
    await Promise.resolve();
    flushCourseData('Admin');
    expect((await result).success).toBeTrue();
    expect(service.batches().map(b => b.id)).toEqual([9]);
    expect(service.notification()?.message).toBe('Jadwal “Grup C” berhasil dihapus.');
  });
});
