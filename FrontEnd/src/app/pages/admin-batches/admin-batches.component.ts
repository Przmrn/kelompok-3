import { ReferenceEditorComponent } from '../admin-courses/reference-editor.component';
import { courseLabels } from '../../models/course-labels';
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CourseBatch } from '../../models/course-system.models';
import { CourseSystemService } from '../../services/course-system.service';

@Component({
  selector: 'app-admin-batches',
  standalone: true,
  imports: [CommonModule, FormsModule, ReferenceEditorComponent],
  templateUrl: './admin-batches.component.html',
})
export class AdminBatchesComponent {
  readonly labels = courseLabels;
  readonly svc = inject(CourseSystemService);

  readonly showForm = signal(false);
  readonly editingBatchId = signal<number | undefined>(undefined);

  form = this.newBatch();

  private newBatch() {
    return {
      courseId: this.svc.courses()[0]?.id ?? 0,
      locationId: this.svc.locations()[0]?.id ?? 0,
      batchName: '',
      startDate: '',
      endDate: '',
      startTime: '09:00',
      endTime: '16:00',
      maxSeats: 30,
    };
  }

  openNewBatchForm(): void {
    if (this.showForm()) {
      this.showForm.set(false);
      return;
    }
    this.editingBatchId.set(undefined);
    this.form = this.newBatch();
    this.showForm.set(true);
  }

  editBatch(b: CourseBatch): void {
    this.editingBatchId.set(b.id);
    this.form = {
      courseId: b.courseId,
      locationId: b.locationId,
      batchName: b.batchName,
      startDate: b.startDate,
      endDate: b.endDate,
      startTime: b.startTime,
      endTime: b.endTime,
      maxSeats: b.maxSeats,
    };
    this.showForm.set(true);
  }

  async saveBatch() {
    const result = await this.svc.saveBatchByAdmin({
      id: this.editingBatchId(),
      ...this.form,
    });
    if (result.success) this.showForm.set(false);
  }
}
