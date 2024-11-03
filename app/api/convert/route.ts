// src/app/api/convert/route.ts

import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import mammoth from 'mammoth';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as Blob;

  if (!file) {
    return NextResponse.json({ error: 'File not provided.' }, { status: 400 });
  }

  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    let content = 'Unsupported file type.';

    const arrayBuffer = await file.arrayBuffer();
    const fileType = file.type;

    // Handle .docx files
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const { value } = await mammoth.extractRawText({ buffer: arrayBuffer });
      content = value || 'No content found in .docx file.';
    }
    // Handle .txt files
    else if (fileType === 'text/plain') {
      content = new TextDecoder().decode(arrayBuffer);
    }

    // Add content to the PDF page
    page.drawText(content, { x: 50, y: 750, maxWidth: 500 });

    const pdfBytes = await pdfDoc.save();
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

    return new Response(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="converted-document.pdf"',
      },
    });
  } catch (error) {
    console.error('Error during file conversion:', error);
    return NextResponse.json({ error: 'File conversion failed.' }, { status: 500 });
  }
}
