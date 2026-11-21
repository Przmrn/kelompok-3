import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { CourseRegistrationCardComponent } from './course-registration-card.component';
import { MyRegistrationsComponent } from './my-registrations.component';

@Component({
  standalone: true,
  imports: [DatePipe, CourseRegistrationCardComponent],
  templateUrl: './course-schedule-tab.component.html',
})
export class CourseScheduleTabComponent {
  readonly page = inject(MyRegistrationsComponent);
  readonly svc = this.page.svc;
}
