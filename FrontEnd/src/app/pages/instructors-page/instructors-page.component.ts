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
  styleUrl: './instructors-page.component.css',
})
export class InstructorsPageComponent {
  readonly svc = inject(CourseSystemService);
  readonly Number = Number;

  readonly selectedInstructorId = signal<number>(1);
  readonly selectedBatchId = signal<number>(2);
  readonly feedbackMessage = signal<{ success: boolean; message: string } | null>(null);

  readonly showForm = signal(false);
  readonly editingInstructorId = signal<number | undefined>(undefined);
  pendingSkill = '';

  form = {
    fullName: '',
    email: '',
    phoneNumber: '',
    expertise: [] as string[],
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
    if (this.showForm()) {
      this.showForm.set(false);
      return;
    }
    this.editingInstructorId.set(undefined);
    this.pendingSkill = '';
    this.form = {
      fullName: '',
      email: '',
      phoneNumber: '',
      expertise: [],
      bio: '',
    };
    this.showForm.set(true);
  }

  editInstructor(ins: Instructor): void {
    this.editingInstructorId.set(ins.id);
    this.pendingSkill = '';
    this.form = {
      fullName: ins.fullName,
      email: ins.email,
      phoneNumber: ins.phoneNumber,
      expertise: [...new Set(this.splitSkills(ins.expertise))],
      bio: ins.bio,
    };
    this.showForm.set(true);
  }

  splitSkills(expertise: string): string[] {
    return expertise.split(',').map(skill => skill.trim()).filter(Boolean);
  }

  addSkills(): void {
    for (const skill of this.splitSkills(this.pendingSkill)) {
      if (!this.form.expertise.some(existing => existing.toLowerCase() === skill.toLowerCase())) {
        this.form.expertise.push(skill);
      }
    }
    this.pendingSkill = '';
  }

  moveSkill(index: number, offset: -1 | 1): void {
    const skills = this.form.expertise;
    const target = index + offset;
    if (target < 0 || target >= skills.length) return;
    [skills[index], skills[target]] = [skills[target], skills[index]];
  }

  saveInstructor(): void {
    if (!this.form.fullName.trim() || !this.form.email.trim()) return;
    this.addSkills();
    const payload = { ...this.form, expertise: this.form.expertise.join(', ') };
    const editId = this.editingInstructorId();
    if (editId) {
      this.svc.updateInstructorByAdmin(editId, payload);
    } else {
      const result = this.svc.addInstructorByAdmin(payload);
      if (!result.success) {
        this.svc.showNotification('warning', 'Pengajar belum tersimpan', result.message);
        return;
      }
    }
    this.showForm.set(false);
  }
}
