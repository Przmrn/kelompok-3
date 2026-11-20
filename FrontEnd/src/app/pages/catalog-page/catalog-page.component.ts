import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Course } from '../../models/course-system.models';
import { CourseSystemService } from '../../services/course-system.service';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.css',
})
export class CatalogPageComponent {
  readonly svc = inject(CourseSystemService);
  readonly studioCities = computed(() => [...new Set(this.svc.locations().map(location => location.city).filter(Boolean))].join(', '));
  readonly selectedCategoryId = signal<number>(0);

  readonly filteredCourses = computed<Course[]>(() => {
    const catId = this.selectedCategoryId();
    return this.svc.courses().filter((c) => catId === 0 || c.categoryId === catId);
  });

  readonly openBatchCount = computed(
    () => this.svc.batches().filter((b) => b.status === 'Open').length
  );

  readonly categoryCount = computed(() => this.svc.categories().length);

  readonly studioCount = computed(() => this.svc.locations().length);

  readonly seatCap = computed(() =>
    Math.max(0, ...this.svc.batches().map((b) => b.maxSeats))
  );

  getCategoryName(categoryId: number): string {
    return this.svc.getCategoryById(categoryId)?.name ?? 'Kelas';
  }

  private openBatchesForCourse(courseId: number) {
    return this.svc.getBatchesByCourseId(courseId).filter(batch => batch.status === 'Open');
  }

  getOpenBatchCount(courseId: number): number {
    return this.openBatchesForCourse(courseId).length;
  }

  getEarlyBirdBadge(courseId: number): string | null {
    const openBatches = this.openBatchesForCourse(courseId);
    if (openBatches.some((b) => this.svc.getNextQueueNumberForBatch(b.id) <= 3)) {
      return 'Diskon 10%';
    }
    if (openBatches.some((b) => this.svc.getNextQueueNumberForBatch(b.id) <= 7)) {
      return 'Diskon 5%';
    }
    return null;
  }

  getLowestMonthly(course: Course): number | null {
    const openBatches = this.openBatchesForCourse(course.id);
    if (!openBatches.length) return null;
    const queue = Math.min(...openBatches.map(batch => batch.nextQueue));
    return this.svc.calculatePriceBreakdown(course.basePrice, queue)
      .installmentPreviews.find(preview => preview.tenorMonths === 12)?.regularMonthlyAmount ?? null;
  }
}
