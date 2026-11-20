import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseSystemService } from '../../services/course-system.service';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart-page.component.html',
})
export class CartPageComponent {
  readonly svc = inject(CourseSystemService);


  readonly unpaidRegistrations = this.svc.unpaidCartRegistrations;

  readonly paidCoursesCount = computed(() => this.svc.purchasedCourses().length);

  getInitialAmountDue(registrationId: number, fallbackTotal: number): number {
    const firstSchedule = this.svc
      .installmentSchedules()
      .find((s) => s.registrationId === registrationId && s.installmentNumber === 1);
    return firstSchedule ? firstSchedule.amount : fallbackTotal;
  }

  cancelOrder(registrationId: number): void {
    void this.svc.confirmCancelRegistration(registrationId);
  }
}
