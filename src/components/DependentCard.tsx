import { X } from 'lucide-react';
import { Dependent } from '../hooks/useEnrollmentStorage';
import { formatDOB } from '../utils/formatters';

interface DependentCardProps {
  dependent: Dependent;
  index: number;
  errors: Record<string, string>;
  onChange: (index: number, field: keyof Dependent, value: string) => void;
  onRemove: (index: number) => void;
}

export default function DependentCard({
  dependent,
  index,
  errors,
  onChange,
  onRemove,
}: DependentCardProps) {
  const getTitle = () => {
    return dependent.relationship;
  };

  const errorPrefix = `dependent_${index}_`;

  const handleDOBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDOB(e.target.value, dependent.dob);
    onChange(index, 'dob', formatted);
  };

  const handleNameBlur = (field: 'firstName' | 'lastName') => (e: React.FocusEvent<HTMLInputElement>) => {
    const trimmedValue = e.target.value.trim();
    if (trimmedValue !== e.target.value) {
      onChange(index, field, trimmedValue);
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 relative">
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition"
        aria-label="Remove dependent"
      >
        <X className="w-5 h-5" />
      </button>

      <h3 className="text-lg font-semibold text-gray-800 mb-4">{getTitle()}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={dependent.firstName}
            onChange={(e) => onChange(index, 'firstName', e.target.value)}
            onBlur={handleNameBlur('firstName')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
              errors[`${errorPrefix}firstName`] ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder=""
          />
          {errors[`${errorPrefix}firstName`] && (
            <p className="mt-1 text-sm text-red-500">{errors[`${errorPrefix}firstName`]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={dependent.lastName}
            onChange={(e) => onChange(index, 'lastName', e.target.value)}
            onBlur={handleNameBlur('lastName')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
              errors[`${errorPrefix}lastName`] ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder=""
          />
          {errors[`${errorPrefix}lastName`] && (
            <p className="mt-1 text-sm text-red-500">{errors[`${errorPrefix}lastName`]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth (MM/DD/YYYY) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={dependent.dob}
            onChange={handleDOBChange}
            maxLength={10}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
              errors[`${errorPrefix}dob`] ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder=""
          />
          {errors[`${errorPrefix}dob`] && (
            <p className="mt-1 text-sm text-red-500">{errors[`${errorPrefix}dob`]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Smoker <span className="text-red-500">*</span>
          </label>
          <select
            value={dependent.smoker}
            onChange={(e) => onChange(index, 'smoker', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none bg-white ${
              errors[`${errorPrefix}smoker`] ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select...</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          {errors[`${errorPrefix}smoker`] && (
            <p className="mt-1 text-sm text-red-500">{errors[`${errorPrefix}smoker`]}</p>
          )}
        </div>
      </div>
    </div>
  );
}
