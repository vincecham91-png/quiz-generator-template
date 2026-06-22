# Quiz Generator – Premium Template

This repository contains a **self‑contained, static web app** that lets you:

1. **Enter an API key** (OpenAI, Anthropic, etc.)
2. **Upload a PDF / DOCX / PPTX** (currently PDF parsing is client‑side; DOCX/PPTX would need a backend service).
3. **Configure quiz parameters** – time limit, marks, number of groups, difficulty distribution.
4. **Generate a multiple‑choice quiz** using a LLM.
5. **Answer questions** with a per‑question timer.
6. **View centered explanations** that play a cute cartoon sound.

## Folder Structure
```
quiz-generator-html/
├─ index.html          # Main page – UI layout
├─ styles.css          # Glassmorphic styling, vibrant gradients
├─ script.js           # All interactive logic (file upload, PDF parsing, LLM calls, timer, modal)
├─ assets/
│   └─ cute_cartoon.wav   # Placeholder sound – replace with your own cute sound
└─ README.md           # You are reading it!
```

## Getting Started
1. Open `index.html` in a modern browser (Chrome, Edge, Firefox). No server is required.
2. **API key** – paste a valid OpenAI `sk-…` key into the field.
3. Click the drop‑zone to upload a **PDF** (other formats are accepted but not parsed in this demo).
4. Adjust the settings to your liking and press **Generate Quiz**.
5. Navigate through the questions, answer, and click **Show Explanation** – a cute sound will play and the explanation appears in a centered modal.

## Customising the Sound
Replace `assets/cute_cartoon.wav` with any short **WAV/MP3** file (max ~2 s) that you find cute. Keep the same filename or update the `<audio>` `src` attribute in `index.html` accordingly.

## Limitations & Future Work
- Only PDF parsing is implemented client‑side via **pdf.js**. DOCX/PPTX would need a backend conversion service.
- The prompt generation is simple; you can tailor `generatePrompt` in `script.js` for richer quizzes.
- Security: API key is stored only in memory while the page is open.

Enjoy building quizzes!
