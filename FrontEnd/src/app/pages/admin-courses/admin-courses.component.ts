import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Course } from '../../models/course-system.models';
import { CourseSystemService } from '../../services/course-system.service';

@Component({
  selector: 'app-admin-courses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-courses.component.html',
})
export class AdminCoursesComponent {
  readonly svc = inject(CourseSystemService);

  readonly showForm = signal(false);
  readonly editingCourseId = signal<number | undefined>(undefined);

  form = {
    categoryId: 1,
    title: '',
    description: '',
    syllabus: '1. Konsep Dasar & Arsitektur\n2. Praktikum Studio & Studi Kasus',
    durationHours: 42,
    basePrice: 1200000,
  };

  openNewCourseForm(): void {
    if (this.showForm() && !this.editingCourseId()) {
      this.showForm.set(false);
      return;
    }
    this.editingCourseId.set(undefined);
    this.form = {
      categoryId: 1,
      title: '',
      description: '',
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
      title: course.title,
      description: course.description,
      syllabus: course.syllabus,
      durationHours: course.durationHours,
      basePrice: course.basePrice,
    };
    this.showForm.set(true);
  }

  saveCourse(): void {
    if (!this.form.title.trim()) return;
    this.svc.saveCourseByAdmin({
      id: this.editingCourseId(),
      ...this.form,
    });
    this.showForm.set(false);
  }
}
