import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
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
  readonly svc = inject(CourseSystemService);
  private readonly router = inject(Router);
  readonly mobileMenuOpen = signal(false);

  readonly userRegCount = computed(() => {
    const student = this.svc.currentStudentProfile();
    if (!student) return 0;
    return this.svc.registrations().filter((r) => r.studentId === student.id).length;
  });

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

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
