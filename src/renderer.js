const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');

const dataFile = path.join(__dirname, '..', 'comments.json');

document.addEventListener('DOMContentLoaded', () => {
  const questions = require('../questions.json');
  renderQuestions(questions);

  document.getElementById('search').addEventListener('input', () => {
    renderQuestions(questions);
  });

  document.getElementById('add-question-button').addEventListener('click', () => {
    const title = document.getElementById('new-question-title').value.trim();
    const link = document.getElementById('new-question-link').value.trim();
    const category = document.getElementById('new-question-category').value.trim();

    if (!title || !link || !category) {
      alert('Please fill in all fields.');
      return;
    }

    const questions = require('../questions.json');
    if (!questions[category]) {
      questions[category] = [];
    }

    questions[category].push({ title, link });

    const fs = require('fs');
    const path = require('path');
    const questionsFile = path.join(__dirname, '..', 'questions.json');
    fs.writeFileSync(questionsFile, JSON.stringify(questions, null, 2));

    alert('Question added successfully!');
    document.getElementById('new-question-title').value = '';
    document.getElementById('new-question-link').value = '';
    document.getElementById('new-question-category').value = '';

    renderQuestions(questions);
  });

  // Window control functionality
  document.getElementById('window-minimize-btn').addEventListener('click', () => {
    ipcRenderer.send('window-control', 'minimize');
  });

  document.getElementById('window-maximize-btn').addEventListener('click', () => {
    ipcRenderer.send('window-control', 'maximize');
  });

  document.getElementById('window-close-btn').addEventListener('click', () => {
    ipcRenderer.send('window-control', 'close');
  });

  // Add event listener for Manage Notes button
  document.getElementById('manage-notes-button').addEventListener('click', () => {
    ipcRenderer.send('open-notes-window');
  });
});

function renderQuestions(questions) {
  const query = document.getElementById('search').value.toLowerCase();
  const container = document.getElementById('problem-list');
  container.innerHTML = '';

  Object.keys(questions).forEach(section => {
    const filtered = questions[section].filter(p => {
      const problemKey = p.title.replace(/ /g, '_');
      const savedData = loadStatus(problemKey);
      return (
        p.title.toLowerCase().includes(query) ||
        (savedData.tags && savedData.tags.toLowerCase().includes(query)) ||
        (savedData.comments && savedData.comments.toLowerCase().includes(query))
      );
    });

    if (filtered.length === 0) return;

    const sectionTitle = document.createElement('h2');
    sectionTitle.textContent = section;
    container.appendChild(sectionTitle);

    const table = document.createElement('table');
    table.innerHTML = '<tr><th>Done</th><th>Problem</th><th>Revisit</th><th>Tags</th><th>Solution</th><th>Comments</th></tr>';
    filtered.forEach(problem => {
      const row = document.createElement('tr');
      const problemKey = problem.title.replace(/ /g, '_');
      const savedData = loadStatus(problemKey);

      row.innerHTML = `
        <td><input type="checkbox" ${savedData.done ? 'checked' : ''} onchange="saveStatus('${problemKey}', 'done', this.checked)"></td>
        <td><a href="${problem.link}" target="_blank">${problem.title}</a></td>
        <td><input type="checkbox" ${savedData.revisit ? 'checked' : ''} onchange="saveStatus('${problemKey}', 'revisit', this.checked)"></td>
        <td style="max-width: 150px; word-wrap: break-word;"><input type="text" style="width: 95%; resize: none; overflow-y: auto; background-color: #1e1e1e; border: 1px solid #3c3c3c; color: #d4d4d4; padding: 5px;" value="${savedData.tags || ''}" onchange="saveStatus('${problemKey}', 'tags', this.value)"></td>
        <td>
          <div style="display: flex; align-items: center;">
            <textarea style="width: 80%; height: 100px; resize: none; background-color: #1e1e1e; border: 1px solid #3c3c3c; color: #d4d4d4;" onchange="saveSolution('${problemKey}', this.value)">${savedData.solution || ''}</textarea>
            <button onclick="openSolutionWindow('${problemKey}');" style="margin-left: 10px; background: none; border: none; cursor: pointer;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4caf50" width="24px" height="24px">
                <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm9 7V3.5L18.5 9H15z"/>
              </svg>
            </button>
          </div>
        </td>
        <td style="max-width: 300px; word-wrap: break-word;"><textarea style="width: 100%; resize: none; overflow-y: auto; background-color: #1e1e1e; border: 1px solid #3c3c3c; color: #d4d4d4; padding: 5px; scrollbar-width: thin; scrollbar-color: #3c3c3c #1e1e1e;" onchange="saveStatus('${problemKey}', 'comments', this.value)" oninput="this.style.height = ''; this.style.height = Math.min(this.scrollHeight, 300) + 'px';" rows="${Math.max(3, Math.min(10, (savedData.comments || '').split('\n').length))}">${savedData.comments || ''}</textarea></td>
      `;
      table.appendChild(row);
    });
    container.appendChild(table);
  });
}

function loadStatus(key) {
  let data = {};
  if (fs.existsSync(dataFile)) {
    data = JSON.parse(fs.readFileSync(dataFile));
  }
  return data[key] || {};
}

function saveSolution(filename, content) {
  ipcRenderer.send('save-solution', filename, content);
  saveStatus(filename, 'solution', content);
}

function saveStatus(key, field, value) {
  let data = {};
  if (fs.existsSync(dataFile)) {
    data = JSON.parse(fs.readFileSync(dataFile));
  }
  if (!data[key]) data[key] = {};
  data[key][field] = value;
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function openSolutionWindow(problemKey) {
  const solution = loadStatus(problemKey).solution || '';
  const solutionWindow = window.open('', '_blank', 'width=800,height=600');
  solutionWindow.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Solution: ${problemKey}</title>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-okaidia.min.css" rel="stylesheet" />
  <style>
    body {
      background-color: #1e1e1e;
      margin: 0;
      padding: 20px;
    }
    pre {
      margin: 0;
      padding: 15px;
      border-radius: 4px;
    }
    code {
      font-family: 'Fira Code', Consolas, 'Courier New', monospace;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <pre><code class="language-cpp">${(solution || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-c.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-cpp.min.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', (event) => {
      Prism.highlightAll();
    });
  </script>
</body>
</html>
  `);
  solutionWindow.document.close();
}
