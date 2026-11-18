import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Registration } from '../../models/course-system.models';
import { CourseSystemService } from '../../services/course-system.service';

type CardTab = 'INFO' | 'REFUND';

@Component({
  selector: 'app-my-registrations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './my-registrations.component.html',
})
export class MyRegistrationsComponent {
  readonly svc = inject(CourseSystemService);

  readonly cardTabs = signal<Record<number, CardTab>>({});
  readonly simulatedCancelDate = signal<string>('2026-11-20');

  readonly userRegistrations = computed(() => {
    const student = this.svc.currentStudentProfile();
    if (!student) return [];
    return this.svc.registrations().filter((r) => r.studentId === student.id);
  });

  getTab(regId: number): CardTab {
    return this.cardTabs()[regId] ?? 'INFO';
  }

  setTab(regId: number, tab: CardTab): void {
    this.cardTabs.update((prev) => ({ ...prev, [regId]: tab }));
  }

  openRefundTab(reg: Registration): void {
    this.setDaysBeforeBatchStart(reg, 16);
    this.setTab(reg.id, 'REFUND');
  }

  getRefundPreview(reg: Registration) {
    return this.svc.calculateRefundPreview(reg, this.simulatedCancelDate());
  }

  setDaysBeforeBatchStart(reg: Registration, daysBefore: number): void {
    const batch = this.svc.getBatchById(reg.batchId);
    const startStr = batch?.startDate ?? '2026-12-12';
    const dt = new Date(`${startStr}T00:00:00`);
    dt.setDate(dt.getDate() - daysBefore);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    this.simulatedCancelDate.set(`${yyyy}-${mm}-${dd}`);
  }

  confirmCancel(registrationId: number): void {
    const res = this.svc.confirmCancelRegistration(
      registrationId,
      this.simulatedCancelDate(),
      'Dibatalkan oleh Student'
    );
    if (res.success) {
      this.setTab(registrationId, 'INFO');
    }
  }
}
