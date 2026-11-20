import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
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

  readonly selectedInstructorId = signal<number | null>(null);
  readonly selectedBatchId = signal<number | null>(null);
  readonly conflictingBatches = computed(() => {
    const instructorId = this.selectedInstructorId();
    const selected = this.svc.batches().find(batch => batch.id === this.selectedBatchId());
    if (!instructorId || !selected) return [];
    const assignedIds = new Set(this.svc.batchInstructors()
      .filter(assignment => assignment.instructorId === instructorId)
      .map(assignment => assignment.batchId));
    return this.svc.batches().filter(batch =>
      assignedIds.has(batch.id) && batch.id !== selected.id &&
      batch.startDate <= selected.endDate && batch.endDate >= selected.startDate &&
      batch.startTime < selected.endTime && batch.endTime > selected.startTime
    );
  });
  readonly feedbackMessage = signal<{ success: boolean; message: string } | null>(null);

  readonly showForm = signal(false);
  readonly editingInstructorId = signal<number | undefined>(undefined);
  pendingSkill = '';
  password = '';

  form = {
    fullName: '',
    email: '',
    phoneNumber: '',
    expertise: [] as string[],
    bio: '',
  };

  async submitAssignment() {
    const batchId = this.selectedBatchId();
    const instructorId = this.selectedInstructorId();
    if (!batchId || !instructorId || this.conflictingBatches().length || this.svc.saving()) return;
    this.feedbackMessage.set(null);
    const res = await this.svc.assignInstructorToBatch({ batchId, instructorId });
    this.feedbackMessage.set(res);
  }

  openNewInstructorForm(): void {
    if (this.showForm()) {
      this.showForm.set(false);
      return;
    }
    this.editingInstructorId.set(undefined);
    this.pendingSkill = '';
    this.password = '';
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
    this.password = '';
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

  async saveInstructor() {
    if (!this.form.fullName.trim() || !this.form.email.trim()) return;
    this.addSkills();
    const payload = { ...this.form, expertise: this.form.expertise.join(', ') };
    const editId = this.editingInstructorId();
    if (!editId && this.password.length < 8) {
      this.svc.showNotification('warning', 'Periksa kata sandi', 'Gunakan minimal 8 karakter untuk akun pengajar.');
      return;
    }
    const result = await this.svc.saveInstructor(editId, editId ? payload : { ...payload, password: this.password });
    if (result.success) {
      this.password = '';
      this.showForm.set(false);
    }
  }
}
