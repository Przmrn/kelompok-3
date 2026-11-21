import { ReferenceEditorComponent } from '../admin-courses/reference-editor.component';
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Course } from '../../models/course-system.models';
import { CourseSystemService } from '../../services/course-system.service';
import { InlineEdit } from '../../inline-edit';

@Component({
  selector: 'app-admin-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, ReferenceEditorComponent],
  templateUrl: './admin-courses.component.html',
})
export class AdminCoursesComponent {
  readonly svc = inject(CourseSystemService);

  readonly edit = new InlineEdit('course-card');
  readonly editingCourseId = signal<number | undefined>(undefined);

  form = this.newCourse();

  private newCourse() {
    return { categoryId: this.svc.categories()[0]?.id ?? 0, syllabus: '', durationHours: 0, basePrice: 0 };
  }

  openNewCourseForm(): void {
    if (this.edit.open() == 'new') {
      this.edit.hide();
      return;
    }
    this.edit.show('new', () => {
      this.editingCourseId.set(undefined);
      this.form = this.newCourse();
    })
  }

  editCourse(course: Course): void {
    if (this.edit.open() == course.id) {
      this.edit.hide();
      return;
    }
    this.edit.show(course.id, () => {
      this.editingCourseId.set(course.id);
      this.form = {
        categoryId: course.categoryId,
        syllabus: course.syllabus,
        durationHours: course.durationHours,
        basePrice: course.basePrice,
      };
    });
  }

  async saveCourse() {
    const result = await this.svc.saveCourseByAdmin({
      id: this.editingCourseId(),
      ...this.form,
    });
    if (result.success) this.edit.hide();
  }
}
