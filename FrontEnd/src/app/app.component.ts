import { courseLabels } from './models/course-labels';
import { CommonModule, DOCUMENT, ViewportScroller } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CourseSystemService } from './services/course-system.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  readonly labels = courseLabels;
  constructor() {
    const document = inject(DOCUMENT);
    inject(ViewportScroller).setOffset(() => [0, document.querySelector('header.k-header')?.clientHeight ?? 0]);
  }

  readonly svc = inject(CourseSystemService);
  private readonly router = inject(Router);
  readonly mobileMenuOpen = signal(false);

  readonly loginEmail = signal('raka.wijaya@karsa.id');
  readonly loginPassword = signal('karsa123');

  readonly regName = signal('');
  readonly regEmail = signal('');
  readonly regPassword = signal('');

  readonly modalError = signal<string | null>(null);

  readonly unpaidCartCount = computed(() => {
    const student = this.svc.currentStudentProfile();
    if (!student) return 0;
    return this.svc.getUnpaidCartRegistrations(student.id).length;
  });

  openSignInModal(): void {
    this.modalError.set(null);
    this.svc.openAuthModal('LOGIN');
    this.closeMobileMenu();
  }

  switchModalMode(mode: 'LOGIN' | 'REGISTER'): void {
    this.modalError.set(null);
    this.svc.openAuthModal(mode);
  }

  handleModalLogin(): void {
    this.modalError.set(null);
    const res = this.svc.loginUser(this.loginEmail(), this.loginPassword());
    if (!res.success) {
      this.modalError.set(res.message);
      return;
    }

    this.svc.closeAuthModal();
    if (res.user?.role === 'Instructor') {
      this.router.navigate(['/teaching-schedule']);
    } else if (res.user?.role === 'Admin') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/courses']);
    }
  }

  handleModalRegister(): void {
    this.modalError.set(null);
    if (!this.regName().trim() || !this.regEmail().trim() || !this.regPassword().trim()) {
      this.modalError.set('Isi nama lengkap, email, dan kata sandi.');
      return;
    }

    const res = this.svc.registerUser({
      fullName: this.regName(),
      email: this.regEmail(),
      password: this.regPassword(),
    });

    if (!res.success) {
      this.modalError.set(res.message);
      return;
    }

    this.regName.set('');
    this.regEmail.set('');
    this.regPassword.set('');
    this.svc.closeAuthModal();
    this.router.navigate(['/profile']);
  }

  switchAccount(userId: number): void {
    const switchedUser = this.svc.switchDemoUser(userId);
    if (!switchedUser) return;

    if (switchedUser.role === 'Instructor') {
      this.router.navigate(['/teaching-schedule']);
    } else if (switchedUser.role === 'Admin') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/courses']);
    }
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
