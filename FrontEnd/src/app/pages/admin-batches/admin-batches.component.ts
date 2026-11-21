import { ReferenceEditorComponent } from '../admin-courses/reference-editor.component';
import { courseLabels } from '../../models/course-labels';
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CourseBatch } from '../../models/course-system.models';
import { CourseSystemService } from '../../services/course-system.service';
import { InlineEdit } from '../../inline-edit';
import { batchError } from '../../admin-validation';

@Component({
  selector: 'app-admin-batches',
  standalone: true,
  imports: [CommonModule, FormsModule, ReferenceEditorComponent],
  templateUrl: './admin-batches.component.html',
})
export class AdminBatchesComponent {
  readonly labels = courseLabels;
  readonly svc = inject(CourseSystemService);

  readonly edit = new InlineEdit('batch-card');
  readonly editingBatchId = signal<number | undefined>(undefined);

  readonly formError = signal('');
  form = this.newBatch();

  private newBatch() {
    const today = new Date().toISOString().slice(0, 10);
    return {
      courseId: this.svc.courses()[0]?.id ?? 0,
      locationId: this.svc.locations()[0]?.id ?? 0,
      batchName: '', startDate: today, endDate: today,
      startTime: '09:00', endTime: '16:00', maxSeats: 30,
    };
  }

  openNewBatchForm(): void {
    if (this.edit.open() === 'new') {
      this.edit.hide();
      return;
    }
    this.edit.show('new', () => {
      this.editingBatchId.set(undefined);
      this.formError.set('');
      this.form = this.newBatch();
    });
  }

  editBatch(b: CourseBatch): void {
    if (this.edit.open() === b.id) {
      this.edit.hide();
      return;
    }
    this.edit.show(b.id, () => {
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
    });
  }

  async saveBatch() {
    const usedSeats = this.svc.getUsedSeatsForBatch(this.editingBatchId() ?? 0);
    this.formError.set(batchError(this.form, this.svc.courses().map(course => course.id), this.svc.locations().map(location => location.id), usedSeats));
    if (this.formError()) return;
    const result = await this.svc.saveBatchByAdmin({
      id: this.editingBatchId(),
      ...this.form,
    });
    if (result.success) this.edit.hide();
    else this.formError.set(result.message);
  }

  async deleteBatch(batch: CourseBatch) {
    const result = await this.svc.deleteBatchByAdmin(batch);
    if (result.success && this.editingBatchId() === batch.id) {
      this.editingBatchId.set(undefined);
      this.edit.hide();
    }
  }
}
