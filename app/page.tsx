// src/app/docverter/page.tsx
"use client"
import React, { useState } from 'react';

const DocverterPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    // Replace this URL with your actual API endpoint for conversion
    const response = await fetch('/api/convert', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } else {
      console.error('File conversion failed.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">Docverter</h1>
      <input
        type="file"
        accept=".doc,.docx,.txt,.odt"
        onChange={handleFileChange}
        className="mb-4"
      />
      <button
        onClick={handleUpload}
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
      >
        Convert to PDF
      </button>

      {pdfUrl && (
        <div className="mt-4">
          <a
            href={pdfUrl}
            download="converted-document.pdf"
            className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
          >
            Download PDF
          </a>
        </div>
      )}
    </div>
  );
};

export default DocverterPage;
