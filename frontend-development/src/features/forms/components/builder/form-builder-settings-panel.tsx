import { FieldSettingsPanel } from './field-settings-panel';
import type { FormBuilderField, FormFieldType } from '../../types/form-builder.types';

interface FormBuilderSettingsPanelProps {
  selectedField?: FormBuilderField;
  readOnly?: boolean;
  canManageBuilder?: boolean;
  onCommitFieldSettings: (
    fieldId: string,
    payload: {
      label: string;
      placeholder: string;
      note: string;
      required: boolean;
      type: FormFieldType;
      fileUpload?: FormBuilderField['fileUpload'];
    }
  ) => void;
  onAddOption: (fieldId: string) => void;
  onUpdateOption: (
    fieldId: string,
    optionLocalId: string,
    patch: { label?: string; value?: string; sort_order?: number }
  ) => void;
  onRemoveOption: (fieldId: string, optionLocalId: string) => void;
}

export const FormBuilderSettingsPanel = ({
  selectedField,
  readOnly,
  canManageBuilder,
  onCommitFieldSettings,
  onAddOption,
  onUpdateOption,
  onRemoveOption
}: FormBuilderSettingsPanelProps) => {
  const lockedField = Boolean(
    selectedField?.isPreSaveLocalSystem ||
      selectedField?.isLocked ||
      selectedField?.isSystem ||
      selectedField?.isCore
  );

  return (
    <aside className="h-full rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="text-sm font-semibold text-gray-900">Field Settings</h3>
      {!selectedField ? (
        <div className="py-12 text-center text-sm text-gray-500">
          <p>Select a field to view or edit its settings</p>
        </div>
      ) : (
        <div className="mt-3">
          <FieldSettingsPanel
            field={selectedField}
            readOnly={Boolean(readOnly) || !canManageBuilder}
            locked={lockedField}
            onCommitFieldSettings={onCommitFieldSettings}
            onAddOption={onAddOption}
            onUpdateOption={onUpdateOption}
            onRemoveOption={onRemoveOption}
          />
        </div>
      )}
    </aside>
  );
};
