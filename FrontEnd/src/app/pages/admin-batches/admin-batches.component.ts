import { ReferenceEditorComponent } from '../admin-courses/reference-editor.component';
import { courseLabels } from '../../models/course-labels';
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CourseBatch } from '../../models/course-system.models';
import { CourseSystemService } from '../../services/course-system.service';
import { InlineEdit } from '../../inline-edit';

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

  form = {
    courseId: 1,
    locationId: 1,
    batchName: 'BCH-BE-04 — Batch 4 Reguler Januari',
    startDate: '2027-01-16',
    endDate: '2027-02-14',
    startTime: '09:00',
    endTime: '16:00',
    maxSeats: 30,
  };

  openNewBatchForm(): void {
    if (this.edit.open() === 'new') {
      this.edit.hide();
      return;
    }
    this.edit.show('new', () => {
      this.editingBatchId.set(undefined);
      this.form = {
        courseId: 1,
        locationId: 1,
        batchName: `BCH-NEW-0${this.svc.batches().length + 1} — Batch Reguler`,
        startDate: '2027-01-16',
        endDate: '2027-02-14',
        startTime: '09:00',
        endTime: '16:00',
        maxSeats: 30,
      };
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
    const result = await this.svc.saveBatchByAdmin({
      id: this.editingBatchId(),
      ...this.form,
    });
    if (result.success) this.edit.hide();
  }

  async deleteBatch(batch: CourseBatch) {
    const result = await this.svc.deleteBatchByAdmin(batch);
    if (result.success && this.editingBatchId() === batch.id) {
      this.editingBatchId.set(undefined);
      this.edit.hide();
    }
  }
}
