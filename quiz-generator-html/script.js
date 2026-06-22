/* script.js – Premium Quiz Generator */

// Utility: select elements
const $ = (sel) => document.querySelector(sel);

// ---------- UI Interactions ----------
// Toggle API key visibility
$('#toggle-key').addEventListener('click', () => {
  const input = $('#api-key');
  if (input.type === 'password') {
    input.type = 'text';
  } else {
    input.type = 'password';
  }
});

// Drag & Drop handling
const dropzone = $('#dropzone');
const fileInput = $('#file-input');

dropzone.addEventListener('click', () => fileInput.click());

dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  const files = e.dataTransfer.files;
  handleFile(files[0]);
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length) handleFile(e.target.files[0]);
});

let uploadedFile = null;
function handleFile(file) {
  const allowed = ['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.presentationml.presentation'];
  if (!allowed.includes(file.type)) {
    alert('Only PDF, DOCX, PPTX are supported.');
    return;
  }
  uploadedFile = file;
  dropzone.innerHTML = `<p>✅ ${file.name} selected</p>`;
}

// ---------- Quiz Generation ----------
const generateBtn = $('#generate-btn');
const quizPanel = $('#quiz-panel');
let quizData = [];
let currentIndex = 0;
let timerInterval = null;

generateBtn.addEventListener('click', async () => {
  if (!uploadedFile) { alert('Please upload a document first.'); return; }
  // Gather settings
  const apiKey = $('#api-key').value.trim();
  if (!apiKey) { alert('Please provide an API key.'); return; }
  const timeLimit = parseInt($('#time-limit').value) || 30;
  const marks = parseInt($('#marks-per-q').value) || 1;
  const easy = parseInt($('#easy-count').value) || 0;
  const medium = parseInt($('#medium-count').value) || 0;
  const hard = parseInt($('#hard-count').value) || 0;

  // Read file content (PDF only for demo)
  const text = await extractTextFromFile(uploadedFile);
  if (!text) { alert('Failed to extract text.'); return; }

  // Call language model to generate quiz JSON (simplified placeholder)
  const prompt = generatePrompt(text, {timeLimit, marks, easy, medium, hard});
  const response = await callOpenAI(apiKey, prompt);
  try {
    quizData = JSON.parse(response);
  } catch (e) {
    console.error('Invalid JSON from model', e);
    alert('Failed to parse quiz data.');
    return;
  }

  if (!Array.isArray(quizData) || quizData.length === 0) {
    alert('No questions generated.');
    return;
  }

  // Show first question
  currentIndex = 0;
  renderQuestion();
  quizPanel.hidden = false;
});

function renderQuestion() {
  const q = quizData[currentIndex];
  const container = $('#question-container');
  container.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'question-card';
  card.innerHTML = `
    <h3>Question ${currentIndex + 1}</h3>
    <p>${q.question}</p>
    <ul>
      ${q.options.map((opt,i)=>`<li><label><input type="radio" name="opt" value="${i}"> ${opt}</label></li>`).join('')}
    </ul>
    <button id="show-explain">Show Explanation</button>
  `;
  container.appendChild(card);

  // Timer
  startTimer(q.timeLimit || parseInt($('#time-limit').value));

  // Navigation buttons state
  $('#prev-q').disabled = currentIndex === 0;
  $('#next-q').disabled = currentIndex === quizData.length - 1;

  // Explanation handling
  $('#show-explain').addEventListener('click', () => {
    const modal = $('#explanation-modal');
    $('#explanation-text').textContent = q.explanation || 'No explanation provided.';
    modal.classList.add('active');
    // Play cute sound
    const snd = $('#explain-sound');
    snd.currentTime = 0;
    snd.play();
  });
}

// Navigation
$('#prev-q').addEventListener('click', () => { if (currentIndex>0) { currentIndex--; renderQuestion(); } });
$('#next-q').addEventListener('click', () => { if (currentIndex<quizData.length-1) { currentIndex++; renderQuestion(); } });

// Modal close
$('#close-modal').addEventListener('click', () => $('#explanation-modal').classList.remove('active'));

function startTimer(seconds) {
  clearInterval(timerInterval);
  const timeLeftEl = $('#time-left');
  let remaining = seconds;
  timeLeftEl.textContent = remaining;
  timerInterval = setInterval(() => {
    remaining--;
    timeLeftEl.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(timerInterval);
      alert('Time is up!');
    }
  }, 1000);
}

// ---------- File Text Extraction (PDF only for demo) ----------
async function extractTextFromFile(file) {
  if (file.type === 'application/pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const txt = await page.getTextContent();
      const pageStr = txt.items.map(item => item.str).join(' ');
      fullText += pageStr + '\n';
    }
    return fullText;
  }
  // For DOCX/PPTX you would need a backend service – not implemented in this static demo.
  return null;
}

// ---------- Prompt Builder ----------
function generatePrompt(sourceText, opts) {
  return `You are given the following source material:\n\n${sourceText}\n\nGenerate a JSON array of quiz questions. Each object must contain:
- "question": string
- "options": array of 4 strings (multiple choice)
- "answer": index of the correct option (0‑3)
- "explanation": short explanation
- "timeLimit": seconds (use ${opts.timeLimit} if not specified)
- "marks": integer (use ${opts.marks})
Distribute the number of questions according to the difficulty counts: ${opts.easy} easy, ${opts.medium} medium, ${opts.hard} hard. Mark easy questions with simple factual answers, medium with moderate reasoning, hard with complex reasoning. Return ONLY the JSON array.`;
}

// ---------- OpenAI API Call (fetch) ----------
async function callOpenAI(apiKey, prompt) {
  const payload = {
    model: 'gpt-3.5-turbo',
    messages: [{role: 'user', content: prompt}],
    temperature: 0.7
  };
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });
  const data = await resp.json();
  return data.choices[0].message.content.trim();
}

// End of script.js
