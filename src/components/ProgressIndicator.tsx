import { CheckCircle, User, FileText, Send } from 'lucide-react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  const steps = [
    { number: 1, title: 'Personal Information', icon: User },
    { number: 2, title: 'Questionnaire', icon: FileText },
    { number: 3, title: 'Address & Submit', icon: Send },
  ];

  return (
    <div className="mb-6 sm:mb-8">
      <div className="relative flex items-center justify-center max-w-3xl mx-auto px-2 sm:px-4">
        {/* Step 1 */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
              1 < currentStep
                ? 'bg-green-600 text-white shadow-lg'
                : 1 === currentStep
                ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-lg'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            {1 < currentStep ? (
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <User className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </div>
          <div className="mt-2 text-center">
            <div
              className={`text-xs font-semibold transition-colors duration-300 ${
                1 === currentStep
                  ? 'text-blue-600'
                  : 1 < currentStep
                  ? 'text-green-600'
                  : 'text-gray-400'
              }`}
            >
              Step 1 of {totalSteps}
            </div>
            <div
              className={`hidden sm:block text-xs font-medium mt-1 transition-colors duration-300 whitespace-nowrap ${
                1 === currentStep
                  ? 'text-gray-900'
                  : 1 < currentStep
                  ? 'text-gray-700'
                  : 'text-gray-400'
              }`}
            >
              Personal Information
            </div>
          </div>
        </div>

        {/* Line 1 */}
        <div className="flex-1 h-1 relative mx-2 sm:mx-4 min-w-[40px] sm:min-w-[60px] max-w-[80px] sm:max-w-[140px]">
          <div className="absolute inset-0 bg-gray-200 rounded-full" />
          <div
            className={`absolute inset-0 rounded-full transition-all duration-500 ${
              1 < currentStep ? 'bg-green-600' : 'bg-gray-200'
            }`}
            style={{
              width: 1 < currentStep ? '100%' : '0%',
            }}
          />
        </div>

        {/* Step 2 */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
              2 < currentStep
                ? 'bg-green-600 text-white shadow-lg'
                : 2 === currentStep
                ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-lg'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            {2 < currentStep ? (
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </div>
          <div className="mt-2 text-center">
            <div
              className={`text-xs font-semibold transition-colors duration-300 ${
                2 === currentStep
                  ? 'text-blue-600'
                  : 2 < currentStep
                  ? 'text-green-600'
                  : 'text-gray-400'
              }`}
            >
              Step 2 of {totalSteps}
            </div>
            <div
              className={`hidden sm:block text-xs font-medium mt-1 transition-colors duration-300 whitespace-nowrap ${
                2 === currentStep
                  ? 'text-gray-900'
                  : 2 < currentStep
                  ? 'text-gray-700'
                  : 'text-gray-400'
              }`}
            >
              Questionnaire
            </div>
          </div>
        </div>

        {/* Line 2 */}
        <div className="flex-1 h-1 relative mx-2 sm:mx-4 min-w-[40px] sm:min-w-[60px] max-w-[80px] sm:max-w-[140px]">
          <div className="absolute inset-0 bg-gray-200 rounded-full" />
          <div
            className={`absolute inset-0 rounded-full transition-all duration-500 ${
              2 < currentStep ? 'bg-green-600' : 'bg-gray-200'
            }`}
            style={{
              width: 2 < currentStep ? '100%' : '0%',
            }}
          />
        </div>

        {/* Step 3 */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
              3 < currentStep
                ? 'bg-green-600 text-white shadow-lg'
                : 3 === currentStep
                ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-lg'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            {3 < currentStep ? (
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <Send className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </div>
          <div className="mt-2 text-center">
            <div
              className={`text-xs font-semibold transition-colors duration-300 ${
                3 === currentStep
                  ? 'text-blue-600'
                  : 3 < currentStep
                  ? 'text-green-600'
                  : 'text-gray-400'
              }`}
            >
              Step 3 of {totalSteps}
            </div>
            <div
              className={`hidden sm:block text-xs font-medium mt-1 transition-colors duration-300 whitespace-nowrap ${
                3 === currentStep
                  ? 'text-gray-900'
                  : 3 < currentStep
                  ? 'text-gray-700'
                  : 'text-gray-400'
              }`}
            >
              Address & Submit
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
