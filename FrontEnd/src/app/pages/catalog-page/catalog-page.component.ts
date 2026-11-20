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
  readonly selectedCategoryId = signal<number>(0);
  readonly categoryIcons: Record<number, string> = {
    1: 'bi-database',
    2: 'bi-window-sidebar',
    3: 'bi-bar-chart-line',
    4: 'bi-bezier2',
  };

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

  getOpenBatchCount(courseId: number): number {
    return this.svc
      .getBatchesByCourseId(courseId)
      .filter((b) => b.status === 'Open').length;
  }

  getEarlyBirdBadge(courseId: number): string | null {
    const openBatches = this.svc
      .getBatchesByCourseId(courseId)
      .filter((b) => b.status === 'Open');
    if (openBatches.some((b) => this.svc.getNextQueueNumberForBatch(b.id) <= 3)) {
      return 'Diskon 10%';
    }
    if (openBatches.some((b) => this.svc.getNextQueueNumberForBatch(b.id) <= 7)) {
      return 'Diskon 5%';
    }
    return null;
  }

  getLowestMonthly(basePrice: number): number {
    const calc = this.svc.calculatePriceBreakdown(basePrice, 1);
    const tenor12 = calc.installmentPreviews.find((p) => p.tenorMonths === 12);
    return tenor12 ? tenor12.regularMonthlyAmount : Math.ceil((basePrice * 1.11) / 12);
  }
}
