import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AuthService, authInterceptor } from './auth.service';
import { CourseSystemService } from './course-system.service';

describe('Sesi akun Karsa', () => {
  const user = { id: 1, fullName: 'Peserta Baru', email: 'baru@example.test', role: 'STUDENT' };
  const session = () => ({ token: 'token-uji', expiresAt: new Date(Date.now() + 60000).toISOString(), user });
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.removeItem('karsa.auth');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    sessionStorage.removeItem('karsa.auth');
  });

  it('membersihkan sesi jika server menolak token aktif dengan tantangan Bearer', () => {
    sessionStorage.setItem('karsa.auth', JSON.stringify(session()));
    const auth = TestBed.inject(AuthService);
    TestBed.inject(HttpClient).get('/api/students/me').subscribe({ error: () => {} });
    const request = http.expectOne('/api/students/me');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token-uji');
    request.flush(null, { status: 401, statusText: 'Unauthorized', headers: { 'WWW-Authenticate': 'Bearer error="invalid_token"' } });
    expect(auth.user()).toBeNull();
    expect(auth.signInRequired()).toBeTrue();
    expect(sessionStorage.getItem('karsa.auth')).toBeNull();
  });

  it('membuat akun tanpa membuka sesi dan mengirim kata sandi apa adanya', () => {
    const auth = TestBed.inject(AuthService);
    auth.register(' Peserta Baru ', user.email, ' sandi uji ').subscribe();
    const request = http.expectOne('/api/auth/register');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ fullName: user.fullName, email: user.email, password: ' sandi uji ' });
    request.flush(user, { status: 201, statusText: 'Created' });
    expect(auth.user()).toBeNull();
  });

  it('membuka sesi peserta tanpa mengaitkan profil atau tagihan akun contoh dengan ID yang sama', () => {
    const auth = TestBed.inject(AuthService);
    auth.login(user.email, 'sandi uji').subscribe();
    const request = http.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: user.email, password: 'sandi uji' });
    request.flush(session());
    const courses = TestBed.inject(CourseSystemService);
    expect(courses.currentUser()?.role).toBe('Student');
    const student = courses.currentStudentProfile()!;
    expect(student.fullName).toBe(user.fullName);
    expect(student.phoneNumber).toBe('');
    expect(courses.getUnpaidCartRegistrations(student.id)).toEqual([]);
    auth.logout();
    expect(auth.user()).toBeNull();
    expect(sessionStorage.getItem('karsa.auth')).toBeNull();
  });

  it('memulihkan sesi, mengirim token ke API aplikasi, dan mengakhiri sesi saat kedaluwarsa', fakeAsync(() => {
    sessionStorage.setItem('karsa.auth', JSON.stringify(session()));
    const auth = TestBed.inject(AuthService);
    const client = TestBed.inject(HttpClient);
    expect(auth.user()?.email).toBe(user.email);
    for (const url of ['/api/courses', '/api/auth/login', 'https://example.test/api/courses']) {
      client.get(url).subscribe();
      const request = http.expectOne(url);
      expect(request.request.headers.get('Authorization')).toBe(url === '/api/courses' ? 'Bearer token-uji' : null);
      request.flush({});
    }
    tick(60000);
    expect(auth.accessToken()).toBeNull();
    expect(auth.user()).toBeNull();
  }));
});
