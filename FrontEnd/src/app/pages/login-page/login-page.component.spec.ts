import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { CourseSystemService } from '../../services/course-system.service';
import { LoginPageComponent } from './login-page.component';

@Component({ standalone: true, template: 'Tujuan' })
class DestinationComponent {}

describe('Halaman Login', () => {
  const login = jasmine.createSpy('login');
  beforeEach(() => {
    login.calls.reset();
    login.and.returnValue(of('Student'));
    TestBed.configureTestingModule({ providers: [
      provideRouter([
        { path: 'login', component: LoginPageComponent },
        { path: 'cart', component: DestinationComponent },
        { path: 'courses', component: DestinationComponent },
      ]),
      { provide: AuthService, useValue: { login } },
      { provide: CourseSystemService, useValue: { openAuthModal: () => {} } },
    ] });
  });
  it('kembali ke URL internal yang semula dilindungi guard', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/login?returnUrl=%2Fcart', LoginPageComponent);
    await page.login('student@example.test', 'password');
    expect(login).toHaveBeenCalledWith('student@example.test', 'password');
    expect(TestBed.inject(Router).url).toBe('/cart');
  });
  it('mengabaikan returnUrl yang menunjuk domain luar', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/login?returnUrl=%2F%2Fevil.example', LoginPageComponent);
    await page.login('student@example.test', 'password');
    expect(TestBed.inject(Router).url).toBe('/courses');
  });
  it('tetap di halaman Login dan menampilkan error untuk sandi salah', async () => {
    login.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/login', LoginPageComponent);
    await page.login('student@example.test', 'wrong');
    harness.detectChanges();
    expect(page.busy()).toBeFalse();
    expect(harness.routeNativeElement!.textContent).toContain('Email atau kata sandi salah');
    expect(TestBed.inject(Router).url).toBe('/login');
  });
});
