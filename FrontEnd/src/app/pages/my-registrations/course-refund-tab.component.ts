import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CourseRegistrationCardComponent } from './course-registration-card.component';
import { MyRegistrationsComponent } from './my-registrations.component';
import { BackendApiService } from '../../services/backend-api.service';
import { Registration, RefundCalculationResult } from '../../models/course-system.models';

@Component({
  standalone: true,
  imports: [DecimalPipe, RouterLink, CourseRegistrationCardComponent],
  templateUrl: './course-refund-tab.component.html',
})
export class CourseRefundTabComponent {
  private readonly page = inject(MyRegistrationsComponent);
  readonly svc = this.page.svc;
  private readonly api = inject(BackendApiService);
  private readonly router = inject(Router);
  private readonly params = toSignal(inject(ActivatedRoute).paramMap, { requireSync: true });


  readonly registration = computed(() => {
    const id = this.params().get('registrationId');
    return this.page.registrations().find(reg =>
      String(reg.id) === id && this.page.svc.canOpenRefund(reg)
    );
  });

  private readonly attempt = signal(0);
  private readonly result = signal<{ registration: Registration; preview?: RefundCalculationResult; error?: string } | null>(null);
  readonly preview = computed(() => this.result()?.registration === this.registration() ? this.result()?.preview : null);
  readonly error = computed(() => this.result()?.registration === this.registration() ? this.result()?.error : null);

  constructor() {
    effect(onCleanup => {
      const registration = this.registration();
      this.attempt();
      this.result.set(null);
      if (!registration) return;
      const request = this.api.cancellationPreview(registration.id).subscribe({
        next: preview => this.result.set({ registration, preview }),
        error: () => this.result.set({ registration, error: 'Ketentuan pembatalan belum berhasil dimuat dari server.' }),
      });
      onCleanup(() => request.unsubscribe());
    });
  }

  retry(): void { this.attempt.update(value => value + 1); }

  async confirmCancel() {
    const reg = this.registration();
    const preview = this.preview();
    if (!reg || !preview?.canCancel || this.svc.saving()) return;
    const result = await this.page.svc.confirmCancelRegistration(reg.id);
    if (result.success) {
      this.router.navigate(['/payments', reg.id]);
    } else {
      this.retry();
    }
  }
}
