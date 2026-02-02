// PDF Parser and Processor
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

async function parsePdfFile(file) {
  if (!file || file.type !== 'application/pdf') {
    throw new Error('Please select a valid PDF file');
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    const totalPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText.trim();
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF. Please try another file.');
  }
}

async function summarizeWithDeepseek(text) {
  const summaryPrompt = `Please provide a comprehensive summary of the following text. Extract key points and main ideas:\n\n${text}`;
  
  try {
    const response = await fetch('http://localhost:3000/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: summaryPrompt })
    });

    if (!response.ok) {
      throw new Error('Failed to get summary from API');
    }

    return response;
  } catch (error) {
    console.error('Summarization error:', error);
    throw new Error('Failed to summarize PDF content');
  }
}
