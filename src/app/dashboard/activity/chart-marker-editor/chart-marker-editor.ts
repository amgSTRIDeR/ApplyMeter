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
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import {
  getLocalDateString,
  parseLocalDate,
} from '../../date-utils';
import type { ChartMarker } from '../../dashboard.models';

export type ChartMarkerEditorResult = Pick<
  ChartMarker,
  'date' | 'description'
>;

@Component({
  selector: 'app-chart-marker-editor',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './chart-marker-editor.html',
  styleUrl: './chart-marker-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartMarkerEditor {
  private readonly dialogRef = inject<
    MatDialogRef<ChartMarkerEditor, ChartMarkerEditorResult>
  >(MatDialogRef);

  readonly today = getLocalDateString(new Date());

  readonly form = new FormGroup({
    date: new FormControl(this.today, {
      nonNullable: true,
      validators: [Validators.required],
    }),

    description: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(120),
      ],
    }),
  });

  canSave(): boolean {
    const { date, description } = this.form.getRawValue();

    return (
      this.form.valid &&
      parseLocalDate(date) !== null &&
      date <= this.today &&
      description.trim().length > 0
    );
  }

  save(): void {
    if (!this.canSave()) {
      return;
    }

    const { date, description } = this.form.getRawValue();

    this.dialogRef.close({
      date,
      description: description.trim(),
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
