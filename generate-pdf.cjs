// Generate PDF from Markdown user guide
const fs = require('fs');
const path = require('path');

// Simple markdown to HTML converter
function markdownToHtml(markdown) {
  return markdown
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.*)$/gm, '<p>$1</p>')
    .replace(/<p><h([1-6])>/g, '<h$1>')
    .replace(/<\/h([1-6])><\/p>/g, '</h$1>')
    .replace(/<p><ul>/g, '<ul>')
    .replace(/<\/ul><\/p>/g, '</ul>')
    .replace(/<p><li>/g, '<li>')
    .replace(/<\/li><\/p>/g, '</li>');
}

// Read the markdown file
const markdownPath = path.join(__dirname, 'docs', 'ARIA5-User-Guide.md');
const markdownContent = fs.readFileSync(markdownPath, 'utf8');

// Convert to HTML
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ARIA5.1 User Guide</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
        h2 { color: #1e40af; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
        h3 { color: #1e3a8a; }
        code { background-color: #f3f4f6; padding: 2px 4px; border-radius: 4px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
        th { background-color: #f9fafb; font-weight: 600; }
        .toc { background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
        @media print {
            body { font-size: 12pt; }
            h1 { page-break-before: always; }
            h2 { page-break-before: avoid; }
        }
    </style>
</head>
<body>
${markdownToHtml(markdownContent)}
</body>
</html>
`;

// Write HTML file
const htmlPath = path.join(__dirname, 'docs', 'ARIA5-User-Guide.html');
fs.writeFileSync(htmlPath, htmlContent);

console.log('HTML version generated:', htmlPath);
console.log('To generate PDF, open the HTML file in Chrome and use Print > Save as PDF');
console.log('Or use a headless Chrome tool like Puppeteer for automated PDF generation.');