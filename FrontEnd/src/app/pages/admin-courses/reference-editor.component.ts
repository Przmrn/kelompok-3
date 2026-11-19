import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CourseCategory, Location } from '../../models/course-system.models';
import { CourseSystemService } from '../../services/course-system.service';

@Component({
  selector: 'app-reference-editor',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reference-editor.component.html',
})
export class ReferenceEditorComponent {
  @Input({ required: true }) kind!: 'locations' | 'course-categories';
  readonly svc = inject(CourseSystemService);
  id?: number;
  form = { name: '', description: '', address: '', city: '', roomName: '' };

  edit(row?: CourseCategory | Location) {
    this.id = row?.id;
    this.form = { name: '', description: '', address: '', city: '', roomName: '', ...row };
  }

  async save() {
    const { name, description, address, city, roomName } = this.form;
    const result = this.kind === 'locations'
      ? await this.svc.saveLocation(this.id, { name, address, city, roomName })
      : await this.svc.saveCategory(this.id, { name, description });
    if (result.success) this.edit();
  }

  async remove(id: number) {
    const result = await this.svc.removeReference(this.kind, id);
    if (result.success && this.id === id) this.edit();
  }
}
