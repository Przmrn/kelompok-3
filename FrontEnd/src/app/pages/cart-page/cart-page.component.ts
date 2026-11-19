import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CourseSystemService } from '../../services/course-system.service';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart-page.component.html',
})
export class CartPageComponent {
  readonly svc = inject(CourseSystemService);
  private readonly router = inject(Router);

  readonly unpaidRegistrations = computed(() => {
    const student = this.svc.currentStudentProfile();
    if (!student) return [];
    return this.svc.getUnpaidCartRegistrations(student.id);
  });

  readonly paidCoursesCount = computed(() => {
    const student = this.svc.currentStudentProfile();
    if (!student) return 0;
    return this.svc.getPaidCoursesForStudent(student.id).length;
  });

  getInitialAmountDue(registrationId: number, fallbackTotal: number): number {
    const firstSchedule = this.svc
      .installmentSchedules()
      .find((s) => s.registrationId === registrationId && s.installmentNumber === 1);
    return firstSchedule ? firstSchedule.amount : fallbackTotal;
  }

  payNow(registrationId: number): void {
    this.svc.payRegistrationFromCart(registrationId);
    this.router.navigate(['/my-courses']);
  }

  cancelOrder(registrationId: number): void {
    const today = new Date().toISOString().slice(0, 10);
    this.svc.confirmCancelRegistration(
      registrationId,
      today,
      'Dibatalkan dari keranjang sebelum pembayaran'
    );
  }
}
