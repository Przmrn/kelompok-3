import { DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
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
    return this.page.svc.calculateRefundPreview(reg, new Date().toISOString().slice(0, 10));
  });

  async confirmCancel() {
    const reg = this.registration();
    const preview = this.preview();
    if (!reg || !preview?.canCancel) return;
    const result = await this.page.svc.confirmCancelRegistration(reg.id);
    if (result.success) {
      this.router.navigate(['/my-courses/jadwal']);
    }
  }
}
