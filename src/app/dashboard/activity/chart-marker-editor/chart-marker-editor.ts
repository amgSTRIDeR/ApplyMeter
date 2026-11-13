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

import {
  getLocalDateString,
  parseLocalDate,
} from '../../date-utils';
import { DEFAULT_CHART_MARKER_COLOR } from '../../dashboard.defaults';
import type {
  ChartMarker,
  ChartMarkerData,
} from '../../dashboard.models';

export type ChartMarkerEditorResult =
  | { action: 'save'; marker: ChartMarkerData }
  | { action: 'delete' };

export interface ChartMarkerEditorData {
  marker: ChartMarker | null;
}

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
  readonly data = inject<ChartMarkerEditorData>(MAT_DIALOG_DATA);

  private readonly dialogRef = inject<
    MatDialogRef<ChartMarkerEditor, ChartMarkerEditorResult>
  >(MatDialogRef);

  readonly today = getLocalDateString(new Date());

  readonly form = new FormGroup({
    date: new FormControl(this.data.marker?.date ?? this.today, {
      nonNullable: true,
      validators: [Validators.required],
    }),

    description: new FormControl(
      this.data.marker?.description ?? '',
      {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.maxLength(120),
        ],
      },
    ),

    color: new FormControl(
      this.data.marker?.color ?? DEFAULT_CHART_MARKER_COLOR,
      {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.pattern(/^#[0-9a-fA-F]{6}$/),
        ],
      },
    ),
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

    const { date, description, color } = this.form.getRawValue();

    this.dialogRef.close({
      action: 'save',
      marker: {
        date,
        description: description.trim(),
        color,
      },
    });
  }

  delete(): void {
    if (this.data.marker) {
      this.dialogRef.close({ action: 'delete' });
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
