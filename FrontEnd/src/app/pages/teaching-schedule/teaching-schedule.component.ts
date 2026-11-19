import { courseLabels } from '../../models/course-labels';
import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { CourseSystemService } from '../../services/course-system.service';

@Component({
  selector: 'app-teaching-schedule',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teaching-schedule.component.html',
})
export class TeachingScheduleComponent {
  readonly labels = courseLabels;
  readonly svc = inject(CourseSystemService);

  readonly instructorProfile = computed(() => this.svc.getLoggedInInstructorProfile());

  readonly myAssignedBatches = computed(() => {
    const ins = this.instructorProfile();
    if (!ins) return [];
    return this.svc.getBatchesForInstructor(ins.id);
  });
}
