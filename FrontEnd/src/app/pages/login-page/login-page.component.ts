import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CourseSystemService } from '../../services/course-system.service';

@Component({
  standalone: true,
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  readonly svc = inject(CourseSystemService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly busy = signal(false);
  readonly error = signal('');

  async login(email: string, password: string): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const role = await firstValueFrom(this.auth.login(email, password));
      const requested = this.route.snapshot.queryParamMap.get('returnUrl');
      const destination = requested?.startsWith('/') && !requested.startsWith('//') && !requested.includes('\\') &&
        !/^\/(login|auth)([/?#;]|$)/.test(requested)
        ? requested : role === 'Admin' ? '/admin/dashboard' : role === 'Instructor' ? '/teaching-schedule' : '/courses';
      await this.router.navigateByUrl(destination);
    } catch (error) {
      this.error.set(error instanceof HttpErrorResponse && error.status === 401
        ? 'Email atau kata sandi salah.' : 'Login belum berhasil. Periksa koneksi Anda lalu coba lagi.');
    } finally {
      this.busy.set(false);
    }
  }
}
