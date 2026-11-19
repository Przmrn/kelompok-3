import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { CourseRegistrationCardComponent } from './course-registration-card.component';
import { MyRegistrationsComponent } from './my-registrations.component';

@Component({
  standalone: true,
  imports: [DecimalPipe, CourseRegistrationCardComponent],
  templateUrl: './course-schedule-tab.component.html',
})
export class CourseScheduleTabComponent {
  readonly page = inject(MyRegistrationsComponent);
  readonly svc = this.page.svc;
}
