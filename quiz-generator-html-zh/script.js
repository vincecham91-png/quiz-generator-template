// script.js – Chinese version of Premium Quiz Generator

// Utility selector
const $ = (sel) => document.querySelector(sel);

document.addEventListener('DOMContentLoaded', () => {
  // Load saved API key if exists
  const savedKey = localStorage.getItem('apiKey');
  if (savedKey) {
    $('#apiKey').value = savedKey;
  }
  // Show tutorial unless previously dismissed
  const tutorial = $('#apiTutorial');
  if (!localStorage.getItem('tutorialDismissed')) {
    tutorial.style.display = 'block';
  } else {
    tutorial.style.display = 'none';
  }
  // Close tutorial button
  $('#closeTutorial').addEventListener('click', () => {
    tutorial.style.display = 'none';
    localStorage.setItem('tutorialDismissed', 'true');
  });
});
$('#toggle-key').addEventListener('click', () => {
  const input = $('#api-key');
  input.type = input.type === 'password' ? 'text' : 'password';
});

// Drag & Drop handling
const dropzone = $('#uploadArea');
const fileInput = $('#fileInput');

dropzone.addEventListener('click', () => fileInput.click());

dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  handleFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length) handleFile(e.target.files[0]);
});

let uploadedFile = null;
function handleFile(file) {
  const allowed = ['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.presentationml.presentation'];
  if (!allowed.includes(file.type)) {
    alert('仅支持 PDF、DOCX、PPTX 文件。');
    return;
  }
  uploadedFile = file;
  dropzone.innerHTML = `<p>✅ ${file.name} 已选择</p>`;
}

// Quiz generation
const generateBtn = $('#generateBtn');
let quizData = [];
let currentIndex = 0;
let timerInterval = null;

generateBtn.addEventListener('click', async () => {
  if (!uploadedFile) { alert('请先上传文档。'); return; }
  const apiKey = $('#apiKey').value.trim();
  if (!apiKey) { alert('请填写 API 密钥。'); return; }
  localStorage.setItem('apiKey', apiKey);
  
  const timeLimit = parseInt($('#timeLimit').value) || 30;
  const marks = parseInt($('#marksPer').value) || 1;
  const easy = parseInt($('#easyPct').value) || 0;
  const medium = parseInt($('#mediumPct').value) || 0;
  const hard = parseInt($('#hardPct').value) || 0;

  const text = await extractTextFromFile(uploadedFile);
  if (!text) { alert('文档内容提取失败。'); return; }

  const prompt = generatePrompt(text, {timeLimit, marks, easy, medium, hard});
  const response = await callOpenAI(apiKey, prompt);
  try {
    quizData = JSON.parse(response);
  } catch (e) {
    console.error('解析 JSON 失败', e);
    alert('模型返回结果解析错误。');
    return;
  }
  if (!Array.isArray(quizData) || quizData.length === 0) {
    alert('未生成任何题目。');
    return;
  }
  currentIndex = 0;
  renderQuestion();
  // Show quiz section after generation
  $('#quizSection').style.display = 'block';
});

// Render the current question and options
function renderQuestion() {
  const q = quizData[currentIndex];
  const container = $('#questionContainer');
  container.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'question-card';
  card.innerHTML = `
    <h3>第 ${currentIndex + 1} 题</h3>
    <p>${q.question}</p>
    <ul>
      ${q.options.map((opt, i) => `
        <li>
          <label>
            <input type="radio" name="opt" value="${i}"> ${opt}
          </label>
        </li>`).join('')}
    </ul>
    <button id="showAnswerBtn" class="btn secondary">查看说明</button>
  `;
  container.appendChild(card);

  // Update progress bar
  const progress = Math.round(((currentIndex + 1) / quizData.length) * 100);
  $('#progressBar').style.width = progress + '%';

  // Start timer (fallback to global time limit if not provided per question)
  startTimer(q.timeLimit || parseInt($('#timeLimit').value));

  // Enable/disable navigation buttons
  $('#prevBtn').disabled = currentIndex === 0;
  $('#nextBtn').disabled = currentIndex === quizData.length - 1;

  // Explanation button
  $('#showAnswerBtn').addEventListener('click', () => {
    $('#explanationText').textContent = q.explanation || '暂无说明。';
    $('#explanationModal').classList.add('active');
    const snd = $('#explainAudio');
    snd.currentTime = 0;
    snd.play();
  });

  // If this is the last question, show result summary after a short delay
  if (currentIndex === quizData.length - 1) {
    setTimeout(() => {
      const totalMarks = quizData.reduce((sum, item) => sum + (item.marks || 1), 0);
      $('#resultText').textContent = `本次测验共 ${quizData.length} 题，总分 ${totalMarks} 分。`;
      $('#resultSection').style.display = 'block';
    }, 500);
  }
}

  // Update navigation button IDs to match HTML
  $('#prevBtn').addEventListener('click', () => { if (currentIndex > 0) { currentIndex--; renderQuestion(); } });
  $('#nextBtn').addEventListener('click', () => { if (currentIndex < quizData.length - 1) { currentIndex++; renderQuestion(); } });
    // Reset API button functionality
    $('#resetApiBtn').addEventListener('click', () => {
      localStorage.removeItem('apiKey');
      localStorage.removeItem('tutorialDismissed');
      location.reload();
    });

    // Close result section button
    $('#closeResultBtn').addEventListener('click', () => {
      $('#resultSection').style.display = 'none';
    });
// Theme toggle handling
$('#themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});
// Apply saved theme on load
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark');
}

function startTimer(seconds) {
  clearInterval(timerInterval);
  const leftEl = $('#time-left');
  let remaining = seconds;
  leftEl.textContent = remaining;
  timerInterval = setInterval(() => {
    remaining--;
    leftEl.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(timerInterval);
      alert('时间到！');
    }
  }, 1000);
}

// PDF 文本提取（仅支持 PDF）
async function extractTextFromFile(file) {
  if (file.type === 'application/pdf') {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({data: buf}).promise;
    let full = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const txt = await page.getTextContent();
      full += txt.items.map(t => t.str).join(' ') + '\n';
    }
    return full;
  }
  return null;
}

function generatePrompt(source, opts) {
  return `以下是原始材料：\n\n${source}\n\n请根据以下要求生成 JSON 数组的测验题目，每题包含以下字段：
- "question"：题目文字
- "options"：4 个选项的数组
- "answer"：正确选项的索引（0‑3）
- "explanation"：答案说明
- "timeLimit"：秒数（使用 ${opts.timeLimit}）
- "marks"：分数（使用 ${opts.marks}）\n请按照难度比例生成题目：简单 ${opts.easy} 题，中等 ${opts.medium} 题，困难 ${opts.hard} 题。只返回 JSON，不要额外文字。`;
}

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
