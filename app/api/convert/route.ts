import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import mammoth from 'mammoth';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as Blob;

  if (!file) {
    return NextResponse.json({ error: 'File not provided.' }, { status: 400 });
  }

  try {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;
    const pageWidth = 600;
    const pageHeight = 800;
    const margin = 50;
    const maxWidth = pageWidth - 2 * margin;
    const lineHeight = fontSize * 1.2;

    const arrayBuffer = await file.arrayBuffer();
    const fileType = file.type;

    // Convert ArrayBuffer to Buffer
    const buffer = Buffer.from(arrayBuffer);

    let content = 'Unsupported file type.';
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const { value } = await mammoth.extractRawText({ buffer });
      content = value || 'No content found in .docx file.';
    } else if (fileType === 'text/plain') {
      content = new TextDecoder().decode(arrayBuffer);
    }

    // Split content into lines manually while respecting line breaks
    const splitTextIntoLines = (
      text: string,
      maxWidth: number,
      fontSize: number,
      font: any
    ) => {
      const paragraphs = text.split('\n'); // Split by line breaks to preserve paragraphs
      const lines: string[] = [];

      paragraphs.forEach(paragraph => {
        const words = paragraph.split(' ');
        let currentLine = '';

        words.forEach(word => {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testLineWidth = font.widthOfTextAtSize(testLine, fontSize);

          if (testLineWidth <= maxWidth) {
            currentLine = testLine;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
        });

        if (currentLine) lines.push(currentLine);
        lines.push(''); // Add an empty line to separate paragraphs
      });

      return lines;
    };

    const lines = splitTextIntoLines(content, maxWidth, fontSize, font);
    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let currentY = pageHeight - margin;

    for (const line of lines) {
      if (currentY - lineHeight < margin) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;
      }

      if (line.trim() === '') {
        // Add vertical space for blank lines (paragraph breaks)
        currentY -= lineHeight;
      } else {
        currentPage.drawText(line, { x: margin, y: currentY, size: fontSize, font });
        currentY -= lineHeight;
      }
    }

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
