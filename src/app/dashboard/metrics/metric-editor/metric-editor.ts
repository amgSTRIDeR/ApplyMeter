import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import type { Metric } from '../../dashboard.models';

export type MetricEditorResult = Pick<
  Metric,
  'name' | 'icon' | 'color'
>;

@Component({
  selector: 'app-metric-editor',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './metric-editor.html',
  styleUrl: './metric-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricEditor {
  readonly metric = inject<Metric | null>(MAT_DIALOG_DATA);

  private readonly dialogRef = inject<
    MatDialogRef<MetricEditor, MetricEditorResult>
  >(MatDialogRef);

  readonly form = new FormGroup({
    name: new FormControl(this.metric?.name ?? '', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(40),
      ],
    }),

    icon: new FormControl(this.metric?.icon ?? 'send', {
      nonNullable: true,
    }),

    color: new FormControl(this.metric?.color ?? '#7657e8', {
      nonNullable: true,
    }),
  });

  save(): void {
    const name = this.form.controls.name.value.trim();

    if (!name) {
      this.form.controls.name.setErrors({
        required: true,
      });
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const result: MetricEditorResult = {
      name,
      icon: this.form.controls.icon.value,
      color: this.form.controls.color.value,
    };

    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
