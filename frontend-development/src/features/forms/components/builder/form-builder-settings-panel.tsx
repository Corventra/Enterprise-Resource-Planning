import { FieldSettingsPanel } from './field-settings-panel';
import type { FormBuilderField } from '../../types/form-builder.types';

interface FormBuilderSettingsPanelProps {
  selectedField?: FormBuilderField;
  readOnly?: boolean;
  onUpdateField: (fieldId: string, payload: Partial<FormBuilderField>) => void;
}

export const FormBuilderSettingsPanel = ({
  selectedField,
  readOnly,
  onUpdateField
}: FormBuilderSettingsPanelProps) => {
  if (readOnly) {
    return (
      <aside className="h-full rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-900">Field Settings</h3>
        <p className="mt-4 text-sm text-slate-500">View only — field settings are not editable.</p>
      </aside>
    );
  }

  return (
    <aside className="h-full rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="text-sm font-semibold text-gray-900">Field Settings</h3>
      {!selectedField ? (
        <div className="py-12 text-center text-sm text-gray-500">
          <p>Select a field to edit its settings</p>
        </div>
      ) : (
        <div className="mt-3">
          <FieldSettingsPanel field={selectedField} onUpdateField={onUpdateField} />
        </div>
      )}
    </aside>
  );
};
