import { courseLabels } from './models/course-labels';
import { CommonModule, DOCUMENT, ViewportScroller } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './services/auth.service';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CourseSystemService } from './services/course-system.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  readonly labels = courseLabels;
  constructor() {
    effect(() => {
      this.auth.user();
      untracked(() => void this.svc.reload());
    }, { allowSignalWrites: true });
    let signedIn = false;
    effect(() => {
      const user = this.svc.currentUser();
      if (signedIn && !user && this.router.url !== '/courses') {
        void this.router.navigate(['/courses']);
      }
      signedIn = !!user;
    });
    const document = inject(DOCUMENT);
    inject(ViewportScroller).setOffset(() => [0, document.querySelector('header.k-header')?.clientHeight ?? 0]);
  }

  readonly svc = inject(CourseSystemService);
  readonly router = inject(Router);
  readonly mobileMenuOpen = signal(false);

  private get needsAccountData(): boolean {
    return !this.router.isActive('/courses', {
      paths: 'subset', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored',
    });
  }

  get pageLoadError(): string {
    return this.svc.loadError() || (this.needsAccountData ? this.svc.accountError() : '');
  }

  get pageLoading(): boolean {
    return this.svc.loading() || (this.needsAccountData && this.svc.accountLoading());
  }

  private readonly auth = inject(AuthService);
  readonly signInRequired = this.auth.signInRequired;
  readonly busy = signal(false);
  readonly loginEmail = signal('');
  readonly registrationNotice = signal('');
  readonly modalError = signal<string | null>(null);

  readonly unpaidCartCount = computed(() => {
    const student = this.svc.currentStudentProfile();
    if (!student) return 0;
    return this.svc.getUnpaidCartRegistrations(student.id).length;
  });

  openSignInModal(): void {
    this.switchModalMode('LOGIN');
    this.closeMobileMenu();
  }

  switchModalMode(mode: 'LOGIN' | 'REGISTER'): void {
    if (this.busy()) return;
    this.modalError.set(null);
    this.registrationNotice.set('');
    this.svc.openAuthModal(mode);
  }

  closeModal(): void {
    if (this.busy()) return;
    this.modalError.set(null);
    this.registrationNotice.set('');
    this.loginEmail.set('');
    this.svc.closeAuthModal();
  }

  async handleLogin(email: string, password: string): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.modalError.set(null);
    try {
      const role = await firstValueFrom(this.auth.login(email, password));
      this.svc.closeAuthModal();
      this.loginEmail.set('');
      this.registrationNotice.set('');
      const destination = role === 'Instructor' ? '/teaching-schedule' : role === 'Admin' ? '/admin/dashboard' : '/courses';
      await this.router.navigate([destination]);
    } catch (error) {
      this.showAuthError(error);
    } finally {
      this.busy.set(false);
    }
  }

  async handleRegister(name: string, email: string, password: string): Promise<void> {
    if (this.busy()) return;
    this.modalError.set(null);
    if (!name.trim()) {
      this.modalError.set('Isi nama lengkap Anda.');
      return;
    }
    this.busy.set(true);
    try {
      const user = await firstValueFrom(this.auth.register(name, email, password));
      this.loginEmail.set(user.email);
      this.registrationNotice.set('Registrasi berhasil, silahkan Login.');
      this.svc.openAuthModal('LOGIN');
    } catch (error) {
      this.showAuthError(error);
    } finally {
      this.busy.set(false);
    }
  }

  private showAuthError(error: unknown): void {
    const status = error instanceof HttpErrorResponse ? error.status : undefined;
    const messages: Record<number, string> = {
      500: 'Server belum dapat dihubungi. Periksa koneksi Anda lalu coba lagi.',
      400: 'Periksa kembali isian formulir Anda.',
      401: 'Email atau kata sandi salah.',
      409: 'Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.',
    };
    this.modalError.set(messages[status ?? -1] ?? 'Permintaan belum berhasil. Silakan coba lagi.');
  }

  handleSignOut(): void {
    this.svc.logoutUser();
    this.router.navigate(['/courses']);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
