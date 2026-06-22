// script.js – Chinese version of Premium Quiz Generator

// Utility selector
const $ = (sel) => document.querySelector(sel);

// Toggle API key visibility
$('#toggle-key').addEventListener('click', () => {
  const input = $('#api-key');
  input.type = input.type === 'password' ? 'text' : 'password';
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
const generateBtn = $('#generate-btn');
let quizData = [];
let currentIndex = 0;
let timerInterval = null;

generateBtn.addEventListener('click', async () => {
  if (!uploadedFile) { alert('请先上传文档。'); return; }
  const apiKey = $('#api-key').value.trim();
  if (!apiKey) { alert('请填写 API 密钥。'); return; }
  const timeLimit = parseInt($('#time-limit').value) || 30;
  const marks = parseInt($('#marks-per-q').value) || 1;
  const easy = parseInt($('#easy-count').value) || 0;
  const medium = parseInt($('#medium-count').value) || 0;
  const hard = parseInt($('#hard-count').value) || 0;

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
  $('#quiz-panel').hidden = false;
});

function renderQuestion() {
  const q = quizData[currentIndex];
  const container = $('#question-container');
  container.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'question-card';
  card.innerHTML = `
    <h3>第 ${currentIndex + 1} 题</h3>
    <p>${q.question}</p>
    <ul>
      ${q.options.map((opt,i) => `<li><label><input type="radio" name="opt" value="${i}"> ${opt}</label></li>`).join('')}
    </ul>
    <button id="show-explain">查看说明</button>
  `;
  container.appendChild(card);

  startTimer(q.timeLimit || parseInt($('#time-limit').value));
  $('#prev-q').disabled = currentIndex === 0;
  $('#next-q').disabled = currentIndex === quizData.length - 1;

  $('#show-explain').addEventListener('click', () => {
    $('#explanation-text').textContent = q.explanation || '暂无说明。';
    $('#explanation-modal').classList.add('active');
    const snd = $('#explain-sound');
    snd.currentTime = 0;
    snd.play();
  });
}

$('#prev-q').addEventListener('click', () => { if (currentIndex > 0) { currentIndex--; renderQuestion(); } });
$('#next-q').addEventListener('click', () => { if (currentIndex < quizData.length - 1) { currentIndex++; renderQuestion(); } });
$('#close-modal').addEventListener('click', () => $('#explanation-modal').classList.remove('active'));

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
