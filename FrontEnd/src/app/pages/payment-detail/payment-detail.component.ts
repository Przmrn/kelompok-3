import { courseLabels } from '../../models/course-labels';
import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CourseSystemService } from '../../services/course-system.service';

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-detail.component.html',
})
export class PaymentDetailPageComponent implements OnInit {
  readonly labels = courseLabels;
  readonly svc = inject(CourseSystemService);
  private readonly route = inject(ActivatedRoute);

  readonly registrationId = signal<number>(1);

  readonly registration = computed(() => {
    const registrations = this.svc.isAdmin() ? this.svc.registrations() : this.svc.myRegistrations();
    return registrations.find(reg => reg.id === this.registrationId()) ?? null;
  });

  readonly schedules = computed(() => {
    const reg = this.registration();
    if (!reg) return [];
    return this.svc
      .installmentSchedules()
      .filter((s) => s.registrationId === reg.id)
      .sort((a, b) => a.installmentNumber - b.installmentNumber);
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('registrationId'));
      this.registrationId.set(id);
    });
  }
}
