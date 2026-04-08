import { Users, UserPlus } from 'lucide-react';
import { Dependent } from '../hooks/useEnrollmentStorage';
import DependentCard from './DependentCard';

interface DependentsSectionProps {
  dependents: Dependent[];
  errors: Record<string, string>;
  onAddSpouse: () => void;
  onAddChild: () => void;
  onChangeDependent: (index: number, field: keyof Dependent, value: string) => void;
  onRemoveDependent: (index: number) => void;
  benefitId: string;
}

export default function DependentsSection({
  dependents,
  errors,
  onAddSpouse,
  onAddChild,
  onChangeDependent,
  onRemoveDependent,
  benefitId,
}: DependentsSectionProps) {
  const hasSpouse = dependents.some(d => d.relationship === 'Spouse');
  const canAddSpouse = !hasSpouse;
  const canAddChild = true;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">Dependents</h2>
        <span className="text-sm text-gray-500 ml-2">(Optional)</span>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Add your spouse and/or children to this enrollment
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          type="button"
          onClick={onAddSpouse}
          disabled={!canAddSpouse}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
            !canAddSpouse
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <UserPlus className="w-5 h-5" />
          Add Spouse
        </button>

        <button
          type="button"
          onClick={onAddChild}
          disabled={!canAddChild}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
            !canAddChild
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          <UserPlus className="w-5 h-5" />
          Add Child
        </button>
      </div>

      {dependents.length > 0 && (
        <div className="space-y-4">
          {dependents.map((dependent, index) => (
            <DependentCard
              key={index}
              dependent={dependent}
              index={index}
              errors={errors}
              onChange={onChangeDependent}
              onRemove={onRemoveDependent}
            />
          ))}
        </div>
      )}
    </div>
  );
}
