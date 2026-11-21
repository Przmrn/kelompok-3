import { courseLabels } from '../../models/course-labels';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CourseSystemService } from '../../services/course-system.service';
import { BackendApiService } from '../../services/backend-api.service';
import { PaymentDetail, Registration } from '../../models/course-system.models';

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-detail.component.html',
})
export class PaymentDetailPageComponent {
  readonly labels = courseLabels;
  readonly svc = inject(CourseSystemService);
  private readonly api = inject(BackendApiService);
  private readonly registrationId = toSignal(inject(ActivatedRoute).paramMap.pipe(
    map(params => Number(params.get('registrationId')))
  ), { requireSync: true });

  readonly record = computed(() => {
    const studentId = this.svc.currentStudentProfile()?.id;
    return this.svc.registrations().find(reg =>
      reg.id === this.registrationId() && (reg.studentId === studentId || this.svc.isAdmin())
    ) ?? null;
  });

  private readonly attempt = signal(0);
  private readonly result = signal<{ record: Registration; payment?: PaymentDetail; error?: string } | null>(null);
  readonly registration = computed(() => {
    const result = this.result();
    return result?.payment && result.record === this.record() ? { ...result.record, ...result.payment } : null;
  });
  readonly error = computed(() => {
    const result = this.result();
    return result && result.record === this.record() ? result.error : null;
  });
  readonly nextInstallment = computed(() => this.registration()?.installmentSchedules.find(s => s.remainingAmount > 0));

  constructor() {
    effect(onCleanup => {
      const record = this.record();
      this.attempt();
      this.result.set(null);
      if (!record) return;
      const request = this.api.paymentDetail(record.id).subscribe({
        next: payment => this.result.set({ record, payment }),
        error: (error: HttpErrorResponse) => this.result.set({ record, error:
          error.status === 403 || error.status === 404 ? 'Rincian pembayaran ini tidak tersedia untuk akun Anda.' :
          'Rincian pembayaran belum berhasil dimuat.' }),
      });
      onCleanup(() => request.unsubscribe());
    });
  }

  retry(): void {
    this.attempt.update(value => value + 1);
  }

  async confirmInstallment(amount: HTMLInputElement): Promise<void> {
    const schedule = this.nextInstallment();
    if (!schedule || !this.svc.isAdmin() || this.svc.saving() || !amount.reportValidity()) return;
    const result = await this.svc.payInstallmentSchedule(schedule.id, amount.valueAsNumber);
    if (!result.success) this.retry();
  }

  async confirmRefund(reference: HTMLInputElement): Promise<void> {
    const reg = this.registration();
    if (!reg || !this.svc.isAdmin() || this.svc.saving() || !reference.reportValidity()) return;
    if (!reference.value.trim()) return;
    const result = await this.svc.confirmRefund(reg.id, reference.value);
    if (!result.success) this.retry();
  }
}
