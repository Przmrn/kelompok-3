import { courseLabels } from '../../models/course-labels';
import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseSystemService } from '../../services/course-system.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './student-dashboard.component.html',
})
export class StudentDashboardComponent {
  readonly labels = courseLabels;
  readonly svc = inject(CourseSystemService);
  readonly currentUser = this.svc.currentUser;

  readonly isProfileComplete = computed(() => {
    const u = this.currentUser();
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
}
