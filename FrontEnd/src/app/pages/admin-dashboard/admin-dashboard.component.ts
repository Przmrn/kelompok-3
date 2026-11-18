import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseSystemService } from '../../services/course-system.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent {
  readonly svc = inject(CourseSystemService);

  readonly openBatchCount = computed(
    () => this.svc.batches().filter((b) => b.status === 'Open').length
  );
  readonly fullBatchCount = computed(
    () => this.svc.batches().filter((b) => b.status === 'Full').length
  );
  readonly confirmedRegCount = computed(
    () =>
      this.svc
        .registrations()
        .filter((r) => r.registrationStatus === 'Confirmed' || r.registrationStatus === 'Completed')
        .length
  );
  readonly totalRevenuePaid = computed(() =>
    this.svc
      .registrations()
      .reduce((acc, r) => acc + this.svc.getTotalPaidForRegistration(r), 0)
  );
}
