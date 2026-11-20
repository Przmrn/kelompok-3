import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CourseSystemService } from '../../services/course-system.service';

@Component({
  selector: 'app-my-registrations',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './my-registrations.component.html',
})
export class MyRegistrationsComponent {
  readonly svc = inject(CourseSystemService);

  readonly paidCourses = this.svc.purchasedCourses;

  readonly unpaidCount = computed(() => this.svc.unpaidCartRegistrations().length);
}
