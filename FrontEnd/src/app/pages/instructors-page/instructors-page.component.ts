import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Instructor } from '../../models/course-system.models';
import { CourseSystemService } from '../../services/course-system.service';

@Component({
  selector: 'app-instructors-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './instructors-page.component.html',
})
export class InstructorsPageComponent {
  readonly svc = inject(CourseSystemService);
  readonly Number = Number;

  readonly selectedInstructorId = signal<number>(1);
  readonly selectedBatchId = signal<number>(2);
  readonly feedbackMessage = signal<{ success: boolean; message: string } | null>(null);

  readonly showForm = signal(false);
  readonly editingInstructorId = signal<number | undefined>(undefined);

  form = {
    fullName: '',
    email: '',
    phoneNumber: '',
    expertise: 'ASP.NET Core, SQL',
    bio: '',
  };

  submitAssignment(): void {
    const res = this.svc.assignInstructorToBatch({
      batchId: this.selectedBatchId(),
      instructorId: this.selectedInstructorId(),
    });
    this.feedbackMessage.set(res);
  }

  testScheduleConflict(): void {
    this.selectedInstructorId.set(1);
    this.selectedBatchId.set(4);
    const res = this.svc.assignInstructorToBatch({
      batchId: 4,
      instructorId: 1,
    });
    this.feedbackMessage.set(res);
  }

  openNewInstructorForm(): void {
    if (this.showForm() && !this.editingInstructorId()) {
      this.showForm.set(false);
      return;
    }
    this.editingInstructorId.set(undefined);
    this.form = {
      fullName: '',
      email: '',
      phoneNumber: '',
      expertise: 'ASP.NET Core, SQL',
      bio: '',
    };
    this.showForm.set(true);
  }

  editInstructor(ins: Instructor): void {
    this.editingInstructorId.set(ins.id);
    this.form = {
      fullName: ins.fullName,
      email: ins.email,
      phoneNumber: ins.phoneNumber,
      expertise: ins.expertise,
      bio: ins.bio,
    };
    this.showForm.set(true);
  }

  saveInstructor(): void {
    if (!this.form.fullName.trim() || !this.form.email.trim()) return;
    const editId = this.editingInstructorId();
    if (editId) {
      this.svc.updateInstructorByAdmin(editId, { ...this.form });
    } else {
      this.svc.addInstructorByAdmin({ ...this.form });
    }
    this.showForm.set(false);
  }
}
