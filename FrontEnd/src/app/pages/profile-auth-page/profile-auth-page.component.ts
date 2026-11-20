import { courseLabels } from '../../models/course-labels';
import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CourseSystemService } from '../../services/course-system.service';

function phoneNumberValidator(control: AbstractControl<string>): ValidationErrors | null {
  const value = control.value.trim();
  if (!value) return null;

  return /^\+?\d(?:[ -]?\d){7,14}$/.test(value) ? null : { phoneNumber: true };
}

@Component({
  selector: 'app-profile-auth-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile-auth-page.component.html',
})
export class ProfileAuthPageComponent {
  readonly labels = courseLabels;
  readonly svc = inject(CourseSystemService);
  readonly isProfileComplete = this.svc.currentProfileComplete;

  readonly myRegistrations = this.svc.myRegistrations;

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

  readonly profileForm = inject(FormBuilder).nonNullable.group({
    fullName: '',
    phoneNumber: ['', phoneNumberValidator],
    address: '',
    city: '',
    province: '',
    country: '',
    educationLevel: '',
    occupation: '',
  });
  readonly phone = this.profileForm.controls.phoneNumber;

  constructor() {
    effect(() => {
      this.profileForm.reset(this.svc.currentStudentProfile() ?? { fullName: this.svc.currentUser()?.fullName ?? '' });
    });
  }

  saveProfile(): void {
    const u = this.svc.currentUser();
    if (u?.role !== 'Student') return;
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    void this.svc.updateStudentProfile(this.profileForm.getRawValue());
  }
}
