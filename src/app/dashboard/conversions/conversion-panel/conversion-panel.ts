import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';

import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
} from '@angular/cdk/drag-drop';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';

import { DashboardStore } from '../../dashboard.store';

import type {
  Conversion,
  ConversionId,
} from '../../dashboard.models';

import {
  ConversionEditor,
  type ConversionEditorData,
  type ConversionEditorResult,
} from '../conversion-editor/conversion-editor';

@Component({
  selector: 'app-conversion-panel',
  imports: [
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    MatButtonModule,
    MatMenuModule,
  ],
  templateUrl: './conversion-panel.html',
  styleUrl: './conversion-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversionPanel {
  readonly store = inject(DashboardStore);

  private readonly dialog = inject(MatDialog);

  openEditor(conversion: Conversion | null = null): void {
    const data: ConversionEditorData = {
      conversion,
      metrics: this.store.metrics(),
      existingConversions: this.store.conversionRows(),
    };

    const dialogRef = this.dialog.open<
      ConversionEditor,
      ConversionEditorData,
      ConversionEditorResult
    >(ConversionEditor, {
      width: '400px',
      data,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      if (conversion) {
        this.store.updateConversion(conversion.id, result);
      } else {
        this.store.addConversion(result);
      }
    });
  }

  deleteConversion(conversionId: ConversionId): void {
    this.store.deleteConversion(conversionId);
  }

  onDrop(event: CdkDragDrop<unknown>): void {
    this.store.reorderConversions(
      event.previousIndex,
      event.currentIndex,
    );
  }
}
