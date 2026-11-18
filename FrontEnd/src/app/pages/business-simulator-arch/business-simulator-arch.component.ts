import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CourseSystemService } from '../../services/course-system.service';

@Component({
  selector: 'app-business-simulator-arch',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './business-simulator-arch.component.html',
})
export class BusinessSimulatorArchPageComponent {
  readonly svc = inject(CourseSystemService);
  readonly Number = Number;

  readonly simBasePrice = signal<number>(1000000);
  readonly simOrder = signal<number>(1);

  readonly simResult = computed(() =>
    this.svc.calculatePriceBreakdown(this.simBasePrice(), this.simOrder())
  );

  loadScenarioTier1(): void {
    this.simBasePrice.set(1000000);
    this.simOrder.set(1);
  }

  loadScenarioTier2(): void {
    this.simBasePrice.set(1000000);
    this.simOrder.set(4);
  }

  loadScenarioRegular(): void {
    this.simBasePrice.set(1000000);
    this.simOrder.set(8);
  }
}
