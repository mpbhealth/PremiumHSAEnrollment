import { Users, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { Dependent } from '../hooks/useEnrollmentStorage';
import { formatPhoneNumber, formatSSN } from '../utils/formatters';
import { useState, useEffect } from 'react';

interface DependentsAddressSectionProps {
  dependents: Dependent[];
  onUpdateDependent: (index: number, dependent: Dependent) => void;
  subscriberAddress?: {
    address1: string;
    city: string;
    state: string;
    zipcode: string;
    email: string;
  };
  errors?: Record<string, string>;
  onClearError?: (field: string) => void;
  invalidDependentIndices?: number[];
}

export default function DependentsAddressSection({
  dependents,
  onUpdateDependent,
  subscriberAddress,
  errors: externalErrors = {},
  onClearError,
  invalidDependentIndices = [],
}: DependentsAddressSectionProps) {
  const [selectedDependentIndex, setSelectedDependentIndex] = useState<number | null>(
    dependents.length > 0 ? 0 : null
  );
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [useSameAddress, setUseSameAddress] = useState<Record<number, boolean>>({});
  const [showDepSSN, setShowDepSSN] = useState(false);

  // Initialize useSameAddress state from dependent data
  useEffect(() => {
    const initialState: Record<number, boolean> = {};
    dependents.forEach((dependent, index) => {
      initialState[index] = dependent.useSameAddress ?? false;
    });
    setUseSameAddress(initialState);
  }, [dependents]);

  // Merge external errors (from wizard validation) with local errors
  const errors = { ...localErrors, ...externalErrors };

  if (dependents.length === 0) {
    return null;
  }

  const selectedDependent = selectedDependentIndex !== null ? dependents[selectedDependentIndex] : null;

  const handleFieldChange = (field: keyof Dependent, value: string) => {
    if (selectedDependentIndex === null) return;

    let formattedValue = value;
    if (field === 'phone') {
      formattedValue = formatPhoneNumber(value, dependents[selectedDependentIndex].phone);
    } else if (field === 'ssn') {
      formattedValue = formatSSN(value, dependents[selectedDependentIndex].ssn);
    }

    const updatedDependent = {
      ...dependents[selectedDependentIndex],
      [field]: formattedValue,
    };

    // First update the dependent data
    onUpdateDependent(selectedDependentIndex, updatedDependent);

    // Then clear only the error for this specific field (both local and external)
    const newErrors = { ...localErrors };
    delete newErrors[field];
    delete newErrors[`dependent_${selectedDependentIndex}_${field}`];
    setLocalErrors(newErrors);

    // Also clear the external error if callback provided
    if (onClearError) {
      onClearError(`dependent_${selectedDependentIndex}_${field}`);
      onClearError(field);
    }
  };

  const validateDependent = (dependent: Dependent): boolean => {
    const newErrors: Record<string, string> = {};

    if (!dependent.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const phoneDigits = dependent.phone.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        newErrors.phone = 'Phone number must be exactly 10 digits';
      }
    }

    if (!dependent.ssn?.trim()) {
      newErrors.ssn = 'Social Security number is required';
    } else {
      const ssnDigits = dependent.ssn.replace(/\D/g, '');
      if (ssnDigits.length !== 9) {
        newErrors.ssn = 'Social Security number must be exactly 9 digits';
      }
    }

    if (!dependent.gender?.trim()) newErrors.gender = 'Gender is required';

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDependentSelect = (index: number) => {
    setSelectedDependentIndex(index);
    setLocalErrors({});
    setShowDepSSN(false);
  };

  const handleSameAddress = () => {
    if (selectedDependentIndex === null || !subscriberAddress) return;

    const updatedDependent = {
      ...dependents[selectedDependentIndex],
      address: subscriberAddress.address1,
      city: subscriberAddress.city,
      state: subscriberAddress.state,
      zipcode: subscriberAddress.zipcode,
      useSameAddress: true,
    };

    setUseSameAddress({ ...useSameAddress, [selectedDependentIndex]: true });
    onUpdateDependent(selectedDependentIndex, updatedDependent);
  };

  const handleDifferentAddress = () => {
    if (selectedDependentIndex === null) return;

    const updatedDependent = {
      ...dependents[selectedDependentIndex],
      useSameAddress: false,
    };

    setUseSameAddress({ ...useSameAddress, [selectedDependentIndex]: false });
    onUpdateDependent(selectedDependentIndex, updatedDependent);
  };

  const isSameAddress = selectedDependentIndex !== null && useSameAddress[selectedDependentIndex];

  return (
    <div className="space-y-6" data-dependents-section>
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">Dependents</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <p className="text-sm font-medium text-gray-700 mb-3">Select Dependent</p>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2 scrollbar-thin">
            {dependents.map((dependent, index) => {
              const hasError = invalidDependentIndices.includes(index);
              return (
              <button
                key={index}
                type="button"
                onClick={() => handleDependentSelect(index)}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-between ${
                  selectedDependentIndex === index
                    ? hasError
                      ? 'border-red-500 bg-red-50 shadow-sm'
                      : 'border-blue-500 bg-blue-50 shadow-sm'
                    : hasError
                      ? 'border-red-500 bg-white hover:border-red-600 hover:bg-red-50'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                }`}
                aria-pressed={selectedDependentIndex === index}
                aria-label={`Select ${dependent.firstName} ${dependent.lastName}`}
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {dependent.firstName} {dependent.lastName}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {dependent.relationship} • {dependent.dob}
                  </p>
                </div>
                <ChevronRight
                  className={`w-5 h-5 transition-colors ${
                    selectedDependentIndex === index
                      ? hasError ? 'text-red-600' : 'text-blue-600'
                      : 'text-gray-400'
                  }`}
                />
              </button>
            );
            })}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedDependent && (
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Address Information for {selectedDependent.firstName} {selectedDependent.lastName}
              </h3>

              {subscriberAddress && (
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={isSameAddress ? handleDifferentAddress : handleSameAddress}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      isSameAddress
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isSameAddress ? 'Use Different Address' : 'Same Address as Above'}
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {isSameAddress && subscriberAddress && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2 font-medium">Using Subscriber's Address:</p>
                    <p className="text-sm text-gray-800">{subscriberAddress.address1}</p>
                    <p className="text-sm text-gray-800">
                      {subscriberAddress.city}, {subscriberAddress.state} {subscriberAddress.zipcode}
                    </p>
                  </div>
                )}

                {!isSameAddress && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={selectedDependent.address || ''}
                        onChange={(e) => handleFieldChange('address', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                          errors[`dependent_${selectedDependentIndex}_address`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder=""
                        aria-required="true"
                        aria-invalid={!!errors[`dependent_${selectedDependentIndex}_address`]}
                      />
                      {errors[`dependent_${selectedDependentIndex}_address`] && (
                        <p className="mt-1 text-sm text-red-500" role="alert">
                          {errors[`dependent_${selectedDependentIndex}_address`]}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={selectedDependent.city || ''}
                          onChange={(e) => handleFieldChange('city', e.target.value)}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                            errors[`dependent_${selectedDependentIndex}_city`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder=""
                          aria-required="true"
                          aria-invalid={!!errors[`dependent_${selectedDependentIndex}_city`]}
                        />
                        {errors[`dependent_${selectedDependentIndex}_city`] && (
                          <p className="mt-1 text-sm text-red-500" role="alert">
                            {errors[`dependent_${selectedDependentIndex}_city`]}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedDependent.state || ''}
                          onChange={(e) => handleFieldChange('state', e.target.value)}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none bg-white ${
                            errors[`dependent_${selectedDependentIndex}_state`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          aria-required="true"
                          aria-invalid={!!errors[`dependent_${selectedDependentIndex}_state`]}
                        >
                          <option value="">Select...</option>
                          <option value="AL">AL</option>
                          <option value="AK">AK</option>
                          <option value="AZ">AZ</option>
                          <option value="AR">AR</option>
                          <option value="CA">CA</option>
                          <option value="CO">CO</option>
                          <option value="CT">CT</option>
                          <option value="DE">DE</option>
                          <option value="FL">FL</option>
                          <option value="GA">GA</option>
                          <option value="HI">HI</option>
                          <option value="ID">ID</option>
                          <option value="IL">IL</option>
                          <option value="IN">IN</option>
                          <option value="IA">IA</option>
                          <option value="KS">KS</option>
                          <option value="KY">KY</option>
                          <option value="LA">LA</option>
                          <option value="ME">ME</option>
                          <option value="MD">MD</option>
                          <option value="MA">MA</option>
                          <option value="MI">MI</option>
                          <option value="MN">MN</option>
                          <option value="MS">MS</option>
                          <option value="MO">MO</option>
                          <option value="MT">MT</option>
                          <option value="NE">NE</option>
                          <option value="NV">NV</option>
                          <option value="NH">NH</option>
                          <option value="NJ">NJ</option>
                          <option value="NM">NM</option>
                          <option value="NY">NY</option>
                          <option value="NC">NC</option>
                          <option value="ND">ND</option>
                          <option value="OH">OH</option>
                          <option value="OK">OK</option>
                          <option value="OR">OR</option>
                          <option value="PA">PA</option>
                          <option value="RI">RI</option>
                          <option value="SC">SC</option>
                          <option value="SD">SD</option>
                          <option value="TN">TN</option>
                          <option value="TX">TX</option>
                          <option value="UT">UT</option>
                          <option value="VT">VT</option>
                          <option value="VA">VA</option>
                          <option value="WA">WA</option>
                          <option value="WV">WV</option>
                          <option value="WI">WI</option>
                          <option value="WY">WY</option>
                          <option value="DC">DC</option>
                        </select>
                        {errors[`dependent_${selectedDependentIndex}_state`] && (
                          <p className="mt-1 text-sm text-red-500" role="alert">
                            {errors[`dependent_${selectedDependentIndex}_state`]}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Zipcode <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={selectedDependent.zipcode || ''}
                          onChange={(e) => handleFieldChange('zipcode', e.target.value)}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                            errors[`dependent_${selectedDependentIndex}_zipcode`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder=""
                          maxLength={5}
                          aria-required="true"
                          aria-invalid={!!errors[`dependent_${selectedDependentIndex}_zipcode`]}
                        />
                        {errors[`dependent_${selectedDependentIndex}_zipcode`] && (
                          <p className="mt-1 text-sm text-red-500" role="alert">
                            {errors[`dependent_${selectedDependentIndex}_zipcode`]}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={selectedDependent.email || ''}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                      errors[`dependent_${selectedDependentIndex}_email`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder=""
                    aria-required="true"
                    aria-invalid={!!errors[`dependent_${selectedDependentIndex}_email`]}
                  />
                  {errors[`dependent_${selectedDependentIndex}_email`] && (
                    <p className="mt-1 text-sm text-red-500" role="alert">
                      {errors[`dependent_${selectedDependentIndex}_email`]}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={selectedDependent.phone || ''}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                        errors[`dependent_${selectedDependentIndex}_phone`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="555-123-4567"
                      maxLength={12}
                      aria-required="true"
                      aria-invalid={!!errors[`dependent_${selectedDependentIndex}_phone`]}
                    />
                    {errors[`dependent_${selectedDependentIndex}_phone`] && (
                      <p className="mt-1 text-sm text-red-500" role="alert">
                        {errors[`dependent_${selectedDependentIndex}_phone`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Social Security <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={selectedDependent.ssn || ''}
                        onChange={(e) => handleFieldChange('ssn', e.target.value)}
                        autoComplete="new-password"
                        className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                          errors[`dependent_${selectedDependentIndex}_ssn`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="XXX-XX-XXXX"
                        maxLength={11}
                        aria-required="true"
                        aria-invalid={!!errors[`dependent_${selectedDependentIndex}_ssn`]}
                        style={{ WebkitTextSecurity: showDepSSN ? 'none' : 'disc' } as React.CSSProperties}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowDepSSN(!showDepSSN)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showDepSSN ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors[`dependent_${selectedDependentIndex}_ssn`] && (
                      <p className="mt-1 text-sm text-red-500" role="alert">
                        {errors[`dependent_${selectedDependentIndex}_ssn`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedDependent.gender || ''}
                      onChange={(e) => handleFieldChange('gender', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none bg-white ${
                        errors[`dependent_${selectedDependentIndex}_gender`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      aria-required="true"
                      aria-invalid={!!errors[`dependent_${selectedDependentIndex}_gender`]}
                    >
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    {errors[`dependent_${selectedDependentIndex}_gender`] && (
                      <p className="mt-1 text-sm text-red-500" role="alert">
                        {errors[`dependent_${selectedDependentIndex}_gender`]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
