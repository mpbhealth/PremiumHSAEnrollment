import { useState, FormEvent } from 'react';
import { Loader2, CheckCircle, XCircle, User, Mail, MapPin, Calendar, FileText } from 'lucide-react';

interface FormData {
  firstName: string;
  lastName: string;
  dob: string;
  email: string;
  smoker: string;
  address1: string;
  city: string;
  state: string;
  zipcode: string;
  agent: string;
  uniqueId: string;
  effectiveDate: string;
  benefitId: string;
  periodId: string;
}

interface ApiResponse {
  success: boolean;
  status: number;
  data?: any;
  error?: string;
  message?: string;
}

export default function EnrollmentForm() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    dob: '',
    email: '',
    smoker: '',
    address1: '',
    city: '',
    state: '',
    zipcode: '',
    agent: '',
    uniqueId: '',
    effectiveDate: '',
    benefitId: '2',
    periodId: '2',
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.dob.trim()) newErrors.dob = 'Date of birth is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.smoker.trim()) newErrors.smoker = 'Smoker status is required';
    if (!formData.address1.trim()) newErrors.address1 = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zipcode.trim()) newErrors.zipcode = 'Zipcode is required';
    if (!formData.agent.trim()) newErrors.agent = 'Agent ID is required';
    if (!formData.uniqueId.trim()) newErrors.uniqueId = 'Unique ID is required';
    if (!formData.effectiveDate.trim()) newErrors.effectiveDate = 'Effective date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const apiUrl = `${supabaseUrl}/functions/v1/enrollment-api-premiumhsa`;

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      setResponse(data);

      if (data.success) {
        setFormData({
          firstName: '',
          lastName: '',
          dob: '',
          email: '',
          smoker: '',
          address1: '',
          city: '',
          state: '',
          zipcode: '',
          agent: '',
          uniqueId: '',
          effectiveDate: '',
          benefitId: '2',
          periodId: '2',
        });
      }
    } catch (error) {
      setResponse({
        success: false,
        status: 500,
        error: 'Network error',
        message: error instanceof Error ? error.message : 'Failed to connect to enrollment API',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Member Enrollment</h1>
          <p className="text-gray-600">Complete the form below to enroll a new member</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8" autoComplete="off">
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="John"
                />
                {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Smith"
                />
                {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth (MM/DD/YYYY) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                    errors.dob ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="02/05/1970"
                />
                {errors.dob && <p className="mt-1 text-sm text-red-500">{errors.dob}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="john.smith@example.com"
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Smoker <span className="text-red-500">*</span>
                </label>
                <select
                  name="smoker"
                  value={formData.smoker}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none bg-white ${
                    errors.smoker ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
                {errors.smoker && <p className="mt-1 text-sm text-red-500">{errors.smoker}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">Address Information</h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address1"
                  value={formData.address1}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                    errors.address1 ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="123 Elm Street"
                />
                {errors.address1 && <p className="mt-1 text-sm text-red-500">{errors.address1}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Laguna Hills"
                  />
                  {errors.city && <p className="mt-1 text-sm text-red-500">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                      errors.state ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="CA"
                    maxLength={2}
                  />
                  {errors.state && <p className="mt-1 text-sm text-red-500">{errors.state}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zipcode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="zipcode"
                    value={formData.zipcode}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                      errors.zipcode ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="92653"
                  />
                  {errors.zipcode && <p className="mt-1 text-sm text-red-500">{errors.zipcode}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">Enrollment Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="agent"
                  value={formData.agent}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                    errors.agent ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="132321321"
                />
                {errors.agent && <p className="mt-1 text-sm text-red-500">{errors.agent}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unique ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="uniqueId"
                  value={formData.uniqueId}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                    errors.uniqueId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="EXT-12345"
                />
                {errors.uniqueId && <p className="mt-1 text-sm text-red-500">{errors.uniqueId}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">Product Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Effective Date (MM/DD/YYYY) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="effectiveDate"
                  value={formData.effectiveDate}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                    errors.effectiveDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="11/01/2025"
                />
                {errors.effectiveDate && <p className="mt-1 text-sm text-red-500">{errors.effectiveDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Benefit ID
                </label>
                <input
                  type="text"
                  name="benefitId"
                  value={formData.benefitId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Period ID
                </label>
                <input
                  type="text"
                  name="periodId"
                  value={formData.periodId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="2"
                />
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Submit Enrollment'
              )}
            </button>
          </div>
        </form>

        {response && (
          <div className={`mt-6 p-6 rounded-lg border-2 ${
            response.success
              ? 'bg-green-50 border-green-500'
              : 'bg-red-50 border-red-500'
          }`}>
            <div className="flex items-start gap-3">
              {response.success ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className={`font-semibold text-lg mb-2 ${
                  response.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {response.success ? 'Enrollment Successful!' : 'Enrollment Failed'}
                </h3>
                <div className="text-sm">
                  <p className={response.success ? 'text-green-800' : 'text-red-800'}>
                    <span className="font-medium">Status:</span> {response.status}
                  </p>
                  {response.error && (
                    <p className="text-red-800 mt-1">
                      <span className="font-medium">Error:</span> {response.error}
                    </p>
                  )}
                  {response.message && (
                    <p className="text-red-800 mt-1">
                      <span className="font-medium">Message:</span> {response.message}
                    </p>
                  )}
                  {response.data && (
                    <details className="mt-3">
                      <summary className={`cursor-pointer font-medium ${
                        response.success ? 'text-green-900' : 'text-red-900'
                      }`}>
                        View API Response
                      </summary>
                      <pre className={`mt-2 p-3 rounded text-xs overflow-x-auto ${
                        response.success ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {JSON.stringify(response.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
