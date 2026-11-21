import { courseLabels } from '../../models/course-labels';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
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
  readonly showOverduePayments = signal(false);
  readonly checkingOverdue = signal(false);
  readonly overduePayments = computed(() =>
    this.svc.overdueRegistrations().map((reg) => {
      const overdueSchedules = this.svc
        .installmentSchedules()
        .filter((s) => s.registrationId === reg.id && s.status === 'Overdue')
        .sort((a, b) => a.installmentNumber - b.installmentNumber)
        .map((s) => ({
          ...s,
          remainingAmount: Math.max(0, s.amount - s.paidAmount),
        }));
      return {
        reg,
        overdueSchedules,
        remainingAmount: this.svc.getRemainingObligationForRegistration(reg),
      };
    })
  );
  readonly refunds = computed(() => this.svc.registrations().filter(reg =>
    reg.registrationStatus === 'Cancelled' && (reg.refundAmount ?? 0) > 0));

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

  async checkOverduePayments(): Promise<void> {
    if (this.checkingOverdue() || this.svc.saving()) return;
    this.checkingOverdue.set(true);
    try {
      const result = await this.svc.processOverdue();
      if (!result.success) return;
      this.showOverduePayments.set(this.overduePayments().length > 0);
    } finally {
      this.checkingOverdue.set(false);
    }
  }

  closeOverduePayments(): void {
    this.showOverduePayments.set(false);
  }
}
