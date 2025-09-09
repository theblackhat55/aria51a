// Script to add user guide to RAG database
import fs from 'fs';
import path from 'path';

// Read the user guide content
const userGuidePath = path.join(process.cwd(), 'docs', 'ARIA5-User-Guide.md');
const content = fs.readFileSync(userGuidePath, 'utf-8');

// Function to chunk text into smaller segments for better RAG performance
function chunkText(text, maxChunkSize = 2000, overlap = 200) {
  const chunks = [];
  const lines = text.split('\n');
  let currentChunk = '';
  let currentSize = 0;
  
  for (const line of lines) {
    const lineSize = line.length + 1; // +1 for newline
    
    // If adding this line would exceed the max size, save current chunk
    if (currentSize + lineSize > maxChunkSize && currentChunk.trim()) {
      chunks.push(currentChunk.trim());
      
      // Start new chunk with overlap
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(overlap / 6)); // Approximate word overlap
      currentChunk = overlapWords.join(' ') + '\n' + line;
      currentSize = currentChunk.length;
    } else {
      currentChunk += (currentChunk ? '\n' : '') + line;
      currentSize += lineSize;
    }
  }
  
  // Add the last chunk if it has content
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Extract sections for better organization
function extractSections(content) {
  const sections = [];
  const lines = content.split('\n');
  let currentSection = { title: '', content: '', level: 0 };
  
  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    
    if (headingMatch) {
      // Save previous section if it has content
      if (currentSection.content.trim()) {
        sections.push({ ...currentSection });
      }
      
      // Start new section
      const level = headingMatch[1].length;
      const title = headingMatch[2];
      currentSection = {
        title,
        content: line,
        level,
        section_type: level === 1 ? 'chapter' : level === 2 ? 'section' : 'subsection'
      };
    } else {
      currentSection.content += (currentSection.content ? '\n' : '') + line;
    }
  }
  
  // Add the last section
  if (currentSection.content.trim()) {
    sections.push(currentSection);
  }
  
  return sections;
}

// Main processing
const sections = extractSections(content);
const allChunks = [];

// Process each section
sections.forEach((section, index) => {
  const chunks = chunkText(section.content);
  
  chunks.forEach((chunk, chunkIndex) => {
    allChunks.push({
      title: section.title || `Section ${index + 1}`,
      content: chunk,
      section_type: section.section_type || 'content',
      chunk_index: chunkIndex,
      section_index: index,
      metadata: JSON.stringify({
        section_title: section.title,
        section_level: section.level,
        chunk_size: chunk.length,
        total_chunks_in_section: chunks.length,
        document_type: 'user_guide',
        version: '1.0',
        created_date: '2024-12-08'
      })
    });
  });
});

console.log(`Processed user guide into ${allChunks.length} chunks from ${sections.length} sections`);

// Generate SQL for inserting the document and chunks
const documentSql = `
INSERT OR REPLACE INTO rag_documents (
  title, 
  content, 
  file_path, 
  document_type, 
  embedding_status, 
  chunk_count,
  metadata,
  uploaded_by,
  organization_id
) VALUES (
  'ARIA5.1 Platform User Guide',
  '${content.replace(/'/g, "''")}',
  '/docs/ARIA5-User-Guide.md',
  'user_guide',
  'processed',
  ${allChunks.length},
  '${JSON.stringify({
    version: '1.0',
    total_sections: sections.length,
    total_chunks: allChunks.length,
    document_size: content.length,
    created_date: '2024-12-08',
    classification: 'internal',
    tags: ['user_guide', 'platform_documentation', 'ai_ml_ratings', 'system_operations']
  }).replace(/'/g, "''")}',
  1,
  1
);
`;

// Generate SQL for inserting chunks
let chunksSql = '';
allChunks.forEach((chunk, index) => {
  chunksSql += `
INSERT INTO document_chunks (
  document_id,
  chunk_index,
  content,
  metadata
) VALUES (
  (SELECT id FROM rag_documents WHERE title = 'ARIA5.1 Platform User Guide' ORDER BY id DESC LIMIT 1),
  ${index},
  '${chunk.content.replace(/'/g, "''")}',
  '${chunk.metadata.replace(/'/g, "''")}'
);
`;
});

// Write SQL files
fs.writeFileSync('insert-user-guide.sql', documentSql + chunksSql);
console.log('Generated insert-user-guide.sql with document and chunks');

// Also create a summary for verification
const summary = {
  document: {
    title: 'ARIA5.1 Platform User Guide',
    sections: sections.length,
    total_chunks: allChunks.length,
    content_size: content.length
  },
  sections: sections.map(s => ({
    title: s.title,
    level: s.level,
    size: s.content.length
  })),
  chunks_preview: allChunks.slice(0, 5).map(c => ({
    title: c.title,
    size: c.content.length,
    preview: c.content.substring(0, 100) + '...'
  }))
};

fs.writeFileSync('user-guide-summary.json', JSON.stringify(summary, null, 2));
console.log('Created user-guide-summary.json for verification');