import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PaymentMethodType } from '../../models/course-system.models';
import { CourseSystemService } from '../../services/course-system.service';

@Component({
  selector: 'app-checkout-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checkout-payment.component.html',
})
export class CheckoutPaymentPageComponent implements OnInit {
  readonly svc = inject(CourseSystemService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly Number = Number;

  readonly batchId = signal<number>(2);
  readonly paymentMethod = signal<PaymentMethodType>('Installment');
  readonly selectedTenor = signal<3 | 6 | 12>(3);

  readonly currentUser = this.svc.currentUser;
  readonly batch = computed(() => this.svc.getBatchById(this.batchId()));
  readonly course = computed(() => {
    const b = this.batch();
    return b ? this.svc.getCourseById(b.courseId) : undefined;
  });
  readonly location = computed(() => {
    const b = this.batch();
    return b ? this.svc.getLocationById(b.locationId) : undefined;
  });

  readonly priceBreakdown = computed(() => {
    const crs = this.course();
    const b = this.batch();
    if (!crs || !b) return null;
    const nextQueue = this.svc.getNextQueueNumberForBatch(b.id);
    return this.svc.calculatePriceBreakdown(crs.basePrice, nextQueue);
  });

  readonly selectedInstallmentPreview = computed(() => {
    const calc = this.priceBreakdown();
    if (!calc) return null;
    return calc.installmentPreviews.find((p) => p.tenorMonths === this.selectedTenor()) ?? null;
  });

  readonly isProfileComplete = computed(() => {
    const u = this.currentUser();
    return u ? this.svc.isStudentProfileComplete(u.id) : false;
  });

  readonly isAlreadyRegistered = computed(() => {
    const student = this.svc.currentStudentProfile();
    const b = this.batch();
    if (!student || !b) return false;
    return this.svc.hasActiveRegistrationInBatch(student.id, b.id);
  });

  readonly canSubmit = computed(() => {
    const u = this.currentUser();
    const b = this.batch();
    if (!u || !b) return false;
    if (u.role !== 'Student' || !this.isProfileComplete()) return false;
    if (b.status === 'Full' || this.svc.getUsedSeatsForBatch(b.id) >= b.maxSeats) return false;
    if (this.isAlreadyRegistered()) return false;
    return true;
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('batchId')) || 2;
      this.batchId.set(id);
    });
  }

  setTenor(tenor: number): void {
    if (tenor === 3 || tenor === 6 || tenor === 12) {
      this.selectedTenor.set(tenor);
    }
  }

  confirmCheckout(): void {
    const u = this.currentUser();
    const b = this.batch();
    if (!u || !b) return;

    const res = this.svc.submitCourseRegistration({
      userId: u.id,
      batchId: b.id,
      paymentMethod: this.paymentMethod(),
      installmentTenor: this.paymentMethod() === 'Installment' ? this.selectedTenor() : null,
      simulateInitialPaymentConfirmed: true,
    });

    if (res.success && res.registration) {
      this.router.navigate(['/payments', res.registration.id]);
    }
  }
}
