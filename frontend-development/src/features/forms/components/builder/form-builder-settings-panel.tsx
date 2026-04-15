import { FieldSettingsPanel } from './field-settings-panel';
import type { FormBuilderField } from '../../types/form-builder.types';

interface FormBuilderSettingsPanelProps {
  selectedField?: FormBuilderField;
  onUpdateField: (fieldId: string, payload: Partial<FormBuilderField>) => void;
}

export const FormBuilderSettingsPanel = ({
  selectedField,
  onUpdateField
}: FormBuilderSettingsPanelProps) => {
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
