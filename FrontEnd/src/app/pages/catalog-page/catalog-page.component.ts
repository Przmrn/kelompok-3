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
})
export class CatalogPageComponent {
  readonly svc = inject(CourseSystemService);
  readonly selectedCategoryId = signal<number>(0);

  readonly filteredCourses = computed<Course[]>(() => {
    const catId = this.selectedCategoryId();
    return this.svc.courses().filter((c) => catId === 0 || c.categoryId === catId);
  });

  getCategoryName(categoryId: number): string {
    return this.svc.getCategoryById(categoryId)?.name.split(' ')[0] ?? 'Kelas';
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
