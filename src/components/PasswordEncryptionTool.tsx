import { useState } from 'react';
import { encryptPassword, decryptPassword } from '../utils/passwordEncryption';
import { Copy, CheckCircle, AlertCircle, Lock, Unlock } from 'lucide-react';

export default function PasswordEncryptionTool() {
  const [plainPassword, setPlainPassword] = useState('');
  const [encryptedPassword, setEncryptedPassword] = useState('');
  const [testDecrypted, setTestDecrypted] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [decryptionTest, setDecryptionTest] = useState<{ success: boolean; message: string } | null>(null);

  const handleEncrypt = () => {
    setError('');
    setDecryptionTest(null);

    if (!plainPassword.trim()) {
      setError('Please enter a password to encrypt');
      return;
    }

    try {
      const encrypted = encryptPassword(plainPassword);
      setEncryptedPassword(encrypted);

      const decrypted = decryptPassword(encrypted);
      setTestDecrypted(decrypted);

      if (decrypted === plainPassword) {
        setDecryptionTest({ success: true, message: 'Encryption verified successfully!' });
      } else {
        setDecryptionTest({ success: false, message: 'Warning: Decryption test failed' });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Encryption failed');
      setEncryptedPassword('');
      setTestDecrypted('');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(encryptedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const handleClear = () => {
    setPlainPassword('');
    setEncryptedPassword('');
    setTestDecrypted('');
    setError('');
    setDecryptionTest(null);
    setCopied(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8 text-center">
            <img src="/assets/MPB-Health-No-background.png" alt="MPB Health Logo" className="h-20 w-auto mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Password Encryption Tool</h1>
            <p className="text-gray-600">Generate encrypted passwords for advisor database entries</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">How to use this tool:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-800">
                  <li>Enter the plain text password you want to encrypt</li>
                  <li>Click "Encrypt Password" to generate the encrypted version</li>
                  <li>Copy the encrypted password using the copy button</li>
                  <li>Paste the encrypted password into the Supabase advisor table</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Plain Text Password
              </label>
              <input
                type="text"
                value={plainPassword}
                onChange={(e) => setPlainPassword(e.target.value)}
                placeholder="Enter password to encrypt"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleEncrypt}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-5 h-5" />
                Encrypt Password
              </button>
              <button
                onClick={handleClear}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {decryptionTest && (
              <div className={`border rounded-lg p-4 flex items-start gap-3 ${
                decryptionTest.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                {decryptionTest.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                )}
                <p className={`text-sm font-medium ${
                  decryptionTest.success ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {decryptionTest.message}
                </p>
              </div>
            )}

            {encryptedPassword && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Encrypted Password (Copy this to Supabase)
                  </label>
                  <div className="relative">
                    <textarea
                      value={encryptedPassword}
                      readOnly
                      rows={4}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                    />
                    <button
                      onClick={handleCopy}
                      className="absolute top-3 right-3 p-2 rounded-md hover:bg-gray-200 transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                  </div>
                  {copied && (
                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Copied to clipboard!
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Decryption Test Result
                  </label>
                  <div className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                    <Unlock className="w-5 h-5 text-gray-600" />
                    <span className="font-mono text-sm">{testDecrypted}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Next Steps:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Copy the encrypted password above</li>
              <li>Go to Supabase Dashboard → Table Editor → advisor table</li>
              <li>Find the advisor row you want to update</li>
              <li>Paste the encrypted password into the "password" column</li>
              <li>Save the changes</li>
            </ol>
          </div>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Important Security Notes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Keep your VITE_ENCRYPTION_SECRET_KEY secure and never share it</li>
                  <li>Use strong, unique passwords for each advisor</li>
                  <li>Do not share plain text passwords via email or chat</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
