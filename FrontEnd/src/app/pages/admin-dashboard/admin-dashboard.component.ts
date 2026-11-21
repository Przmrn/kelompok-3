import { courseLabels } from '../../models/course-labels';
import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReferenceEditorComponent } from '../admin-courses/reference-editor.component';
import { CourseSystemService } from '../../services/course-system.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ReferenceEditorComponent],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent {
  readonly labels = courseLabels;
  readonly svc = inject(CourseSystemService);
  readonly adminRegistrations = this.svc.adminRegistrations;

  readonly openBatchCount = computed(
    () => this.svc.batches().filter((b) => b.status === 'Open').length
  );
  readonly fullBatchCount = computed(
    () => this.svc.batches().filter((b) => b.status === 'Full').length
  );
  readonly confirmedRegCount = computed(
    () =>
      this.adminRegistrations()
        .filter((r) => r.registrationStatus === 'Confirmed')
        .length
  );
  readonly totalRevenuePaid = computed(() =>
    this.svc
      .registrations()
      .reduce((acc, r) => acc + this.svc.getTotalPaidForRegistration(r), 0)
  );
}
