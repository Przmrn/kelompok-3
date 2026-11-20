import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { User } from '../models/course-system.models';
import { AuthService } from './auth.service';
import { accountId, flushCourseData, student } from './course-api.testing';
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

  it('tetap menampilkan katalog ketika profil peserta gagal dimuat', async () => {
    const loading = service.reload();
    TestBed.flushEffects();
    http.expectOne('/api/Registration/me').flush([]);
    http.expectOne('/api/students/me').flush({}, { status: 401, statusText: 'Unauthorized' });
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
});
