import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CourseSystemService } from '../../services/course-system.service';

@Component({
  selector: 'app-profile-auth-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile-auth-page.component.html',
})
export class ProfileAuthPageComponent {
  readonly svc = inject(CourseSystemService);
  private readonly router = inject(Router);

  readonly activeView = signal<'PROFILE' | 'REGISTER' | 'LOGIN'>('PROFILE');
  readonly authAlert = signal<{ success: boolean; message: string } | null>(null);

  readonly regName = signal('');
  readonly regEmail = signal('');
  readonly regPhone = signal('');
  readonly regPassword = signal('');

  readonly loginEmail = signal('raka.wijaya@karsa.id');
  readonly loginPassword = signal('karsa123');

  readonly isProfileComplete = computed(() => {
    const u = this.svc.currentUser();
    return u ? this.svc.isStudentProfileComplete(u.id) : false;
  });

  readonly myRegistrations = computed(() => {
    const student = this.svc.currentStudentProfile();
    if (!student) return [];
    return this.svc.registrations().filter((r) => r.studentId === student.id);
  });

  readonly confirmedCount = computed(
    () =>
      this.myRegistrations().filter(
        (r) => r.registrationStatus === 'Confirmed' || r.registrationStatus === 'Completed'
      ).length
  );

  readonly totalPaid = computed(() =>
    this.myRegistrations().reduce(
      (acc, r) => acc + this.svc.getTotalPaidForRegistration(r),
      0
    )
  );

  readonly totalRemaining = computed(() =>
    this.myRegistrations().reduce(
      (acc, r) => acc + this.svc.getRemainingObligationForRegistration(r),
      0
    )
  );

  profileForm = {
    fullName: '',
    phoneNumber: '',
    address: '',
    city: '',
    province: '',
    country: '',
    educationLevel: '',
    occupation: '',
  };

  constructor() {
    effect(() => {
      const u = this.svc.currentUser();
      const s = this.svc.currentStudentProfile();
      if (s) {
        this.profileForm = {
          fullName: s.fullName,
          phoneNumber: s.phoneNumber,
          address: s.address,
          city: s.city,
          province: s.province,
          country: s.country,
          educationLevel: s.educationLevel,
          occupation: s.occupation,
        };
      } else if (u && u.role !== 'Student') {
        this.activeView.set('LOGIN');
      }
    });
  }

  handleRegister(): void {
    if (!this.regName().trim() || !this.regEmail().trim() || !this.regPhone().trim()) {
      this.authAlert.set({
        success: false,
        message: 'Mohon lengkapi FullName, Email, PhoneNumber, dan Password.',
      });
      return;
    }

    const res = this.svc.registerUser({
      fullName: this.regName(),
      email: this.regEmail(),
      phoneNumber: this.regPhone(),
      password: this.regPassword() || '123456',
    });

    this.authAlert.set(res);
    if (res.success) {
      this.activeView.set('PROFILE');
    }
  }

  testDuplicateEmail(): void {
    this.regName.set('Raka Duplikat');
    this.regEmail.set('raka.wijaya@karsa.id');
    this.regPhone.set('081200001111');
    this.regPassword.set('tes123');
    const res = this.svc.registerUser({
      fullName: 'Raka Duplikat',
      email: 'raka.wijaya@karsa.id',
      phoneNumber: '081200001111',
      password: 'tes123',
    });
    this.authAlert.set(res);
  }

  handleLogin(): void {
    const res = this.svc.loginUser(this.loginEmail(), this.loginPassword());
    this.authAlert.set(res);
    if (res.success && res.user) {
      if (res.user.role === 'Instructor') {
        this.router.navigate(['/teaching-schedule']);
      } else if (res.user.role === 'Admin') {
        this.router.navigate(['/admin/dashboard']);
      } else {
        this.router.navigate(['/courses']);
      }
    }
  }

  autoFillCompleteProfile(): void {
    const u = this.svc.currentUser();
    if (!u) return;
    this.profileForm = {
      fullName: u.fullName,
      phoneNumber: this.profileForm.phoneNumber || '085711223344',
      address: 'Jl. Dago Asri No. 19, Coblong',
      city: 'Bandung',
      province: 'Jawa Barat',
      country: 'Indonesia',
      educationLevel: 'S1 Sistem Informasi',
      occupation: 'Mahasiswa',
    };
    this.saveProfile();
  }

  saveProfile(): void {
    const u = this.svc.currentUser();
    if (!u) return;
    this.svc.updateStudentProfile(u.id, { ...this.profileForm });
  }
}
