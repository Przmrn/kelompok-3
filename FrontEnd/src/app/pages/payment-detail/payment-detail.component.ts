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
  readonly svc = inject(CourseSystemService);
  private readonly route = inject(ActivatedRoute);

  readonly registrationId = signal<number>(1);

  readonly registration = computed(() =>
    this.svc.registrations().find((r) => r.id === this.registrationId()) ??
    this.svc.registrations()[0] ??
    null
  );

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
      const id = Number(params.get('registrationId')) || 1;
      this.registrationId.set(id);
    });
  }
}
