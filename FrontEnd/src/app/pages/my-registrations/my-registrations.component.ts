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

  readonly paidCourses = computed(() => {
    const student = this.svc.currentStudentProfile();
    if (!student) return [];
    return this.svc.getPaidCoursesForStudent(student.id);
  });

  readonly unpaidCount = computed(() => {
    const student = this.svc.currentStudentProfile();
    if (!student) return 0;
    return this.svc.getUnpaidCartRegistrations(student.id).length;
  });
}
