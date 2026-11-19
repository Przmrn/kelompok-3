import { ReferenceEditorComponent } from '../admin-courses/reference-editor.component';
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Course } from '../../models/course-system.models';
import { CourseSystemService } from '../../services/course-system.service';

@Component({
  selector: 'app-admin-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, ReferenceEditorComponent],
  templateUrl: './admin-courses.component.html',
})
export class AdminCoursesComponent {
  readonly svc = inject(CourseSystemService);

  readonly showForm = signal(false);
  readonly editingCourseId = signal<number | undefined>(undefined);

  form = {
    categoryId: this.svc.categories()[0]?.id ?? 0,
    syllabus: '1. Konsep Dasar & Arsitektur\n2. Praktikum Studio & Studi Kasus',
    durationHours: 42,
    basePrice: 1200000,
  };

  openNewCourseForm(): void {
    if (this.showForm()) {
      this.showForm.set(false);
      return;
    }
    this.editingCourseId.set(undefined);
    this.form = {
      categoryId: this.svc.categories()[0]?.id ?? 0,
      syllabus: '1. Konsep Dasar & Arsitektur\n2. Praktikum Studio & Studi Kasus',
      durationHours: 42,
      basePrice: 1200000,
    };
    this.showForm.set(true);
  }

  editCourse(course: Course): void {
    this.editingCourseId.set(course.id);
    this.form = {
      categoryId: course.categoryId,
      syllabus: course.syllabus,
      durationHours: course.durationHours,
      basePrice: course.basePrice,
    };
    this.showForm.set(true);
  }

  async saveCourse() {
    const result = await this.svc.saveCourseByAdmin({
      id: this.editingCourseId(),
      ...this.form,
    });
    if (result.success) this.showForm.set(false);
  }
}
