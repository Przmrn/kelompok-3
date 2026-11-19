import { courseLabels } from '../../models/course-labels';
import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Registration } from '../../models/course-system.models';
import { CourseSystemService } from '../../services/course-system.service';

@Component({
  selector: 'app-course-registration-card',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './course-registration-card.component.html',
})
export class CourseRegistrationCardComponent {
  readonly labels = courseLabels;
  @Input({ required: true }) reg!: Registration;
  readonly svc = inject(CourseSystemService);
}
