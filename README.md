# Quiz Generator Template

Simple Flask template that accepts `.pptx`, `.docx`, and `.pdf` uploads and generates a multiple-choice quiz based on extracted text.

Quick start

1. Create a Python virtual environment and activate it.

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate
pip install -r requirements.txt
```

2. Run the app

```bash
python app.py
```

3. Open `http://127.0.0.1:5000` in your browser, upload a file, and generate a quiz.

Pushing to GitHub

```bash
git init
git add .
git commit -m "Add quiz-generator template"
# create a repo on GitHub and push
git remote add origin https://github.com/<your-username>/<repo>.git
git branch -M main
git push -u origin main
```

Notes

- This template supports `.docx`, `.pptx` and `.pdf`. For legacy `.doc` files convert to `.docx` first.
- The question generator is a simple heuristic; you'll likely want to improve question quality with an NLP model or custom rules.
