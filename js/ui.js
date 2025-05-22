import { getEntries, addEntry, updateEntry, deleteEntry } from './storage.js';

let mode = "sent";
let selectedRelatedEntries = new Set();

function showForm(selected, entry = null) {
  mode = selected;
  const formArea = document.getElementById("formArea");
  formArea.style.display = "block";
  formArea.className = selected === "sent" ? "" : "received-mode";
  document.getElementById("formTitle").textContent = selected === "sent" ? "贈った記録" : "もらった記録";
  
  if (entry) {
    document.getElementById("editingId").value = entry.id;
    document.getElementById("partner").value = entry.partner;
    document.getElementById("title").value = entry.title || "";
    document.getElementById("date").value = entry.date;
    document.getElementById("content").value = entry.content;
    mode = entry.type;
    selectedRelatedEntries = new Set(entry.relatedEntries || []);
  } else {
    document.getElementById("editingId").value = "";
    document.getElementById("partner").value = "";
    document.getElementById("title").value = "";
    document.getElementById("date").value = "";
    document.getElementById("content").value = "";
    selectedRelatedEntries.clear();
  }
  updateRelatedGiftsList();
}

function updateRelatedGiftsList() {
  const list = document.getElementById("relatedGiftsList");
  list.innerHTML = "";
  const entries = getEntries();
  const partner = document.getElementById("partner").value.trim();
  
  entries
    .filter(e => 
      e.partner === partner && 
      e.id !== document.getElementById("editingId").value &&
      e.type !== mode
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach(e => {
      const div = document.createElement("div");
      div.className = `related-gift-item ${selectedRelatedEntries.has(e.id) ? 'selected' : ''} ${e.type}`;
      div.onclick = () => toggleRelatedEntry(e.id);

      const typeIndicator = document.createElement("div");
      typeIndicator.className = `type-indicator ${e.type}`;
      div.appendChild(typeIndicator);

      const content = document.createElement("div");
      content.className = "content";
      content.textContent = e.content;
      div.appendChild(content);

      const date = document.createElement("div");
      date.className = "date";
      date.textContent = e.date;
      div.appendChild(date);

      list.appendChild(div);
    });
}

function toggleRelatedEntry(id) {
  if (selectedRelatedEntries.has(id)) {
    selectedRelatedEntries.delete(id);
  } else {
    selectedRelatedEntries.add(id);
  }
  updateRelatedGiftsList();
}

function saveEntry() {
  const editingId = document.getElementById("editingId").value;
  const partner = document.getElementById("partner").value.trim();
  const title = document.getElementById("title").value.trim();
  const date = document.getElementById("date").value;
  const content = document.getElementById("content").value.trim();
  
  if (!partner || !title || !date || !content) {
    return alert("すべて入力してください");
  }
  
  const newEntry = {
    id: editingId ? parseInt(editingId) : Date.now(),
    type: mode,
    partner,
    title,
    date,
    content,
    relatedEntries: Array.from(selectedRelatedEntries)
  };

  if (editingId) {
    updateEntry(newEntry);
  } else {
    addEntry(newEntry);
  }

  document.getElementById("formArea").style.display = "none";
  renderEntries();
}

function renderEntries() {
  const entries = getEntries();
  const filter = document.getElementById("filter").value.trim();
  const list = document.getElementById("entryList");
  list.innerHTML = "";
  
  entries
    .filter(e => !filter || e.partner.includes(filter))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach(e => {
      const div = document.createElement("div");
      div.className = "entry";

      const typeIndicator = document.createElement("div");
      typeIndicator.className = `type-indicator ${e.type}`;
      div.appendChild(typeIndicator);

      const typeLabel = document.createElement("div");
      typeLabel.className = "type-label";
      typeLabel.textContent = `${e.partner}さん に${e.type === 'sent' ? '贈った' : 'もらった'}`;
      div.appendChild(typeLabel);

      const contentDiv = document.createElement("div");
      contentDiv.className = "content";

      const titleSpan = document.createElement("span");
      titleSpan.className = "title";
      titleSpan.textContent = e.title;
      contentDiv.appendChild(titleSpan);

      const dateSpan = document.createElement("span");
      dateSpan.className = "date";
      dateSpan.textContent = e.date;
      contentDiv.appendChild(dateSpan);

      const contentSpan = document.createElement("span");
      contentSpan.className = "description";
      contentSpan.innerHTML = e.content.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
      );
      contentDiv.appendChild(contentSpan);

      if (e.relatedEntries && e.relatedEntries.length > 0) {
        const relatedDiv = document.createElement("div");
        relatedDiv.className = "related-entries";
        relatedDiv.style.marginTop = "0.5rem";
        relatedDiv.style.fontSize = "0.9rem";
        relatedDiv.style.color = "var(--text-color)";
        relatedDiv.style.opacity = "0.7";
        
        const relatedEntries = entries.filter(r => e.relatedEntries.includes(r.id));
        relatedDiv.innerHTML = `関連：<br>${relatedEntries.map(r => 
          `${r.date} - ${r.title}(${r.content})`
        ).join('<br>')}`;
        
        contentDiv.appendChild(relatedDiv);
      }

      div.appendChild(contentDiv);

      const actionsDiv = document.createElement("div");
      actionsDiv.className = "actions";

      const editBtn = document.createElement("button");
      editBtn.className = `edit ${e.type}`;
      editBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        編集
      `;
      editBtn.onclick = () => showForm(e.type, e);
      actionsDiv.appendChild(editBtn);

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete";
      deleteBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18"></path>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        削除
      `;
      deleteBtn.onclick = () => {
        if (confirm("削除してもよいですか？")) {
          deleteEntry(e.id);
          renderEntries();
        }
      };
      actionsDiv.appendChild(deleteBtn);

      div.appendChild(actionsDiv);
      list.appendChild(div);
    });
}

// イベントリスナーの設定
document.getElementById("partner").addEventListener("input", updateRelatedGiftsList);

export {
  showForm,
  saveEntry,
  renderEntries
}; 