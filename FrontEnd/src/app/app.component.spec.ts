import { flushCourseData } from './services/course-api.testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './services/auth.service';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('menampilkan hasil pendaftaran, menolak sandi salah, dan membuka halaman sesuai peran', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const auth = TestBed.inject(AuthService);
    auth.logout();
    const view: HTMLElement = fixture.nativeElement;
    const setValue = (id: string, value: string) => {
      view.querySelector<HTMLInputElement>('#' + id)!.value = value;
    };
    const submit = () => view.querySelector<HTMLFormElement>('form')!.requestSubmit();
    const user = { id: 12, fullName: 'Pengguna Uji', email: 'uji@example.test', role: 'STUDENT' };
    app.switchModalMode('REGISTER');
    fixture.detectChanges();
    flushCourseData('Guest');
    setValue('register-name', user.fullName);
    setValue('register-email', user.email);
    setValue('register-password', 'sandi uji');
    submit();
    http.expectOne('/api/auth/register').flush(user, { status: 201, statusText: 'Created' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(view.querySelector<HTMLInputElement>('#login-email')!.value).toBe(user.email);
    expect(view.querySelector('[role=status]')!.textContent).toContain('Registrasi berhasil');
    setValue('login-password', 'sandi salah');
    submit();
    http.expectOne('/api/auth/login').flush({}, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(view.querySelector('[role=alert]')!.textContent).toContain('Email atau kata sandi salah');
    setValue('login-password', 'sandi admin');
    submit();
    http.expectOne('/api/auth/login').flush({
      user: { ...user, role: 'ADMIN' }, token: 'token-uji', expiresAt: new Date(Date.now() + 60000).toISOString(),
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(navigate).toHaveBeenCalledWith(['/admin/dashboard']);
    expect(app.svc.authModalOpen()).toBeFalse();
    flushCourseData('Admin');
    auth.logout();
    http.verify();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
