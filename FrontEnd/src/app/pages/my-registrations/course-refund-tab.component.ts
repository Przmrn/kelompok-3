import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CourseRegistrationCardComponent } from './course-registration-card.component';
import { MyRegistrationsComponent } from './my-registrations.component';

@Component({
  standalone: true,
  imports: [DecimalPipe, RouterLink, CourseRegistrationCardComponent],
  templateUrl: './course-refund-tab.component.html',
})
export class CourseRefundTabComponent {
  private readonly page = inject(MyRegistrationsComponent);
  private readonly router = inject(Router);
  private readonly params = toSignal(inject(ActivatedRoute).paramMap, { requireSync: true });

  readonly daysBefore = signal(16);
  readonly registration = computed(() => {
    const id = this.params().get('registrationId');
    return this.page.paidCourses().find(reg =>
      String(reg.id) === id && reg.registrationStatus !== 'Cancelled' && reg.registrationStatus !== 'Completed'
    );
  });

  readonly preview = computed(() => {
    const reg = this.registration();
    if (!reg) return null;
    const batch = this.page.svc.getBatchById(reg.batchId);
    if (!batch) return null;
    const date = new Date(batch.startDate + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() - this.daysBefore());
    return this.page.svc.calculateRefundPreview(reg, date.toISOString().slice(0, 10));
  });

  confirmCancel(): void {
    const reg = this.registration();
    const preview = this.preview();
    if (!reg || !preview?.canCancel) return;
    const result = this.page.svc.confirmCancelRegistration(
      reg.id, preview.cancellationDate, 'Dibatalkan oleh Student'
    );
    if (result.success) {
      this.router.navigate(['/my-courses/jadwal']);
    }
  }
}
