import { courseLabels } from '../../models/course-labels';
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CourseBatch } from '../../models/course-system.models';
import { CourseSystemService } from '../../services/course-system.service';

@Component({
  selector: 'app-admin-batches',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-batches.component.html',
})
export class AdminBatchesComponent {
  readonly labels = courseLabels;
  readonly svc = inject(CourseSystemService);

  readonly showForm = signal(false);
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
    status: 'Open' as 'Open' | 'Full',
  };

  openNewBatchForm(): void {
    if (this.showForm() && !this.editingBatchId()) {
      this.showForm.set(false);
      return;
    }
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
      status: 'Open',
    };
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
      status: b.status,
    };
    this.showForm.set(true);
  }

  saveBatch(): void {
    this.svc.saveBatchByAdmin({
      id: this.editingBatchId(),
      ...this.form,
    });
    this.showForm.set(false);
  }
}
