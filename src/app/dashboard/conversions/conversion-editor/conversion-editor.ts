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
import { MatSelectModule } from '@angular/material/select';

import type {
  Conversion,
  Metric,
} from '../../dashboard.models';

export type ConversionEditorResult = Pick<
  Conversion,
  'fromMetricId' | 'toMetricId'
>;

export interface ConversionEditorData {
  conversion: Conversion | null;
  metrics: Metric[];
  existingConversions: Conversion[];
}

@Component({
  selector: 'app-conversion-editor',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './conversion-editor.html',
  styleUrl: './conversion-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversionEditor {
  readonly data = inject<ConversionEditorData>(MAT_DIALOG_DATA);

  private readonly dialogRef = inject<
    MatDialogRef<ConversionEditor, ConversionEditorResult>
  >(MatDialogRef);

  readonly form = new FormGroup({
    fromMetricId: new FormControl(
      this.data.conversion?.fromMetricId ?? '',
      {
        nonNullable: true,
        validators: [Validators.required],
      },
    ),

    toMetricId: new FormControl(
      this.data.conversion?.toMetricId ?? '',
      {
        nonNullable: true,
        validators: [Validators.required],
      },
    ),
  });

  isSameMetric(): boolean {
    return (
      this.form.controls.fromMetricId.value ===
      this.form.controls.toMetricId.value
    );
  }

  isDuplicate(): boolean {
    const { fromMetricId, toMetricId } = this.form.getRawValue();

    return this.data.existingConversions.some(
      (conversion) =>
        conversion.id !== this.data.conversion?.id &&
        conversion.fromMetricId === fromMetricId &&
        conversion.toMetricId === toMetricId,
    );
  }

  canSave(): boolean {
    return (
      this.form.valid &&
      !this.isSameMetric() &&
      !this.isDuplicate()
    );
  }

  save(): void {
    if (!this.canSave()) {
      return;
    }

    this.dialogRef.close(this.form.getRawValue());
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
