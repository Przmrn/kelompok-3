import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CourseSystemService } from '../../services/course-system.service';

@Component({
  selector: 'app-course-detail-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './course-detail-checkout.component.html',
})
export class CourseDetailCheckoutComponent implements OnInit {
  readonly svc = inject(CourseSystemService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly courseId = signal<number>(1);
  readonly selectedBatchId = signal<number>(2);

  readonly currentUser = this.svc.currentUser;
  readonly course = computed(() => this.svc.getCourseById(this.courseId()));
  readonly courseBatches = computed(() => this.svc.getBatchesByCourseId(this.courseId()));

  readonly selectedBatch = computed(() => {
    const id = this.selectedBatchId();
    const batches = this.courseBatches();
    return batches.find((b) => b.id === id) ?? batches[0] ?? null;
  });

  readonly batchInstructors = computed(() => {
    const b = this.selectedBatch();
    return b ? this.svc.getInstructorsForBatch(b.id) : [];
  });

  readonly selectedBatchFull = computed(() => {
    const batch = this.selectedBatch();
    return !!batch && (batch.status === 'Full' || this.svc.getRemainingSeatsForBatch(batch.id) === 0);
  });

  readonly priceBreakdown = computed(() => {
    const crs = this.course();
    const batch = this.selectedBatch();
    if (!crs || !batch) return null;
    const nextQueue = this.svc.getNextQueueNumberForBatch(batch.id);
    return this.svc.calculatePriceBreakdown(crs.basePrice, nextQueue);
  });

  readonly syllabus = computed(() => {
    const crs = this.course();
    if (!crs) return [];
    return this.svc
      .getSyllabusList(crs.syllabus)
      .map((line) => line.replace(/^\s*\d+\s*[.)\-]\s*/, '').trim());
  });

  readonly isProfileComplete = computed(() => {
    const u = this.currentUser();
    return u ? this.svc.isStudentProfileComplete(u.id) : false;
  });

  readonly isAlreadyRegisteredInBatch = computed(() => {
    const student = this.svc.currentStudentProfile();
    const batch = this.selectedBatch();
    if (!student || !batch) return false;
    return this.svc.hasActiveRegistrationInBatch(student.id, batch.id);
  });

  readonly canProceedToCheckout = computed(() => {
    const user = this.currentUser();
    const batch = this.selectedBatch();
    if (!user || !batch) return false;
    if (user.role !== 'Student' || !this.isProfileComplete()) return false;
    if (this.selectedBatchFull()) return false;
    if (this.isAlreadyRegisteredInBatch()) return false;
    return true;
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id')) || 1;
      this.courseId.set(id);
      const batches = this.svc.getBatchesByCourseId(id);
      const firstOpen = batches.find((b) => b.status === 'Open') ?? batches[0];
      if (firstOpen) {
        this.selectedBatchId.set(firstOpen.id);
      }
    });
  }

  selectBatch(batchId: number): void {
    this.selectedBatchId.set(batchId);
  }

  getLocationLabel(locationId: number): string {
    const loc = this.svc.getLocationById(locationId);
    return loc ? `${loc.name} (${loc.roomName}, ${loc.city})` : '';
  }

  goToCheckout(): void {
    const b = this.selectedBatch();
    if (!b) return;
    this.router.navigate(['/checkout', b.id]);
  }
}
