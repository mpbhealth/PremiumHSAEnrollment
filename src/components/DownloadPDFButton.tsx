import { useState } from 'react';
import { Download } from 'lucide-react';

interface DownloadPDFButtonProps {
  pdfUrl: string;
  filename?: string;
}

export default function DownloadPDFButton({ pdfUrl, filename = 'enrollment.pdf' }: DownloadPDFButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);

    try {
      const response = await fetch(pdfUrl);

      if (!response.ok) {
        throw new Error('Failed to fetch PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors shadow-md"
      >
        <Download className="w-5 h-5" />
        {isDownloading ? 'Downloading...' : 'Download Enrollment PDF'}
      </button>
      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}
    </div>
  );
}
