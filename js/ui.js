import { getEntries, addEntry, updateEntry, deleteEntry } from './storage.js';

let mode = "sent";
let selectedRelatedEntries = new Set();

function showForm(selected, entry = null) {
  mode = selected;
  const formArea = document.getElementById("formArea");
  formArea.style.display = "block";
  formArea.className = selected === "sent" ? "" : "received-mode";
  document.getElementById("formTitle").textContent = selected === "sent" ? "贈った記録" : "受け取った記録";
  
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
    
    // 今日の日付を初期値として設定
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // getMonth()は0から始まるため+1
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById("date").value = `${yyyy}-${mm}-${dd}`;

    document.getElementById("content").value = "";
    selectedRelatedEntries.clear();
  }
  updateRelatedGiftsList();

  // フォームエリアまでスクロール
  document.getElementById("formArea").scrollIntoView({ behavior: 'smooth' });

  // 編集モードの場合、最初の入力フィールドにフォーカス
  if (entry) {
    document.getElementById("partner").focus();
  }
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
  let partner = document.getElementById("partner").value.trim();
  let title = document.getElementById("title").value.trim();
  const date = document.getElementById("date").value;
  const content = document.getElementById("content").value.trim();

  if (!partner || !title || !date || !content) {
    return alert("すべて入力してください");
  }

  // 相手の名前と品名に文字数制限を適用 (100文字)
  if (partner.length > 100) {
    partner = partner.substring(0, 100);
  }
  if (title.length > 100) {
    title = title.substring(0, 100);
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

// HTML特殊文字をエスケープする関数
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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

      // 日付表示（右上）
      const dateLabel = document.createElement("div");
      dateLabel.className = "date-label";
      const formattedDate = new Date(e.date).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      dateLabel.textContent = `${formattedDate}`;
      div.appendChild(dateLabel);

      const contentDiv = document.createElement("div");
      contentDiv.className = "content";

      // パートナー名・タイプ情報表示（タイトルの上）
      const typeLabel = document.createElement("div");
      typeLabel.className = "type-label";
      typeLabel.textContent = `${e.partner}さん ${e.type === 'sent' ? 'へ贈った' : 'から受け取った'}`;
      contentDiv.appendChild(typeLabel);

      const titleSpan = document.createElement("span");
      titleSpan.className = "title";
      titleSpan.textContent = e.title;
      contentDiv.appendChild(titleSpan);

      const contentWrapper = document.createElement("div");
      contentWrapper.className = "content-wrapper";

      const contentSpan = document.createElement("span");
      contentSpan.className = "description";

      // コンテンツ内のURLのみをリンク化し、それ以外の部分をエスケープする
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      let lastIndex = 0;
      let htmlParts = [];

      e.content.replace(urlRegex, (match, offset) => {
          // URL前のテキスト部分をエスケープして追加
          const textBeforeUrl = e.content.substring(lastIndex, offset);
          htmlParts.push(escapeHtml(textBeforeUrl));

          // URL部分をリンクとして追加 (URL自体はエスケープしない)
          htmlParts.push(`<a href="${match}" target="_blank" rel="noopener noreferrer">${match}</a>`);

          lastIndex = offset + match.length;
          return match; // replaceメソッドの仕様上必要
      });

      // 最後のURL以降のテキスト部分をエスケープして追加
      const textAfterLastUrl = e.content.substring(lastIndex);
      htmlParts.push(escapeHtml(textAfterLastUrl));

      // 全てを結合してinnerHTMLに設定
      contentSpan.innerHTML = htmlParts.join('');

      contentWrapper.appendChild(contentSpan);

      if (e.relatedEntries && e.relatedEntries.length > 0) {
        const relatedDiv = document.createElement("div");
        relatedDiv.className = "related-entries";
        const relatedEntries = entries.filter(r => e.relatedEntries.includes(r.id));
        relatedDiv.innerHTML = `関連：<br>${relatedEntries.map(r => 
          `${r.date} - ${r.title}(${r.content})`
        ).join('<br>')}`;
        contentWrapper.appendChild(relatedDiv);
      }

      contentDiv.appendChild(contentWrapper);

      // コンテンツの長さをチェックして、必要な場合のみボタンを表示
      setTimeout(() => {
        if (contentWrapper.scrollHeight > 100) {
          const toggleButton = document.createElement("button");
          toggleButton.className = "toggle-description";
          toggleButton.innerHTML = `
            もっと見る
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          `;
          toggleButton.onclick = () => {
            contentWrapper.classList.toggle('expanded');
            toggleButton.innerHTML = contentWrapper.classList.contains('expanded') ? 
              `閉じる
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>` :
              `もっと見る
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>`;
          };
          contentDiv.appendChild(toggleButton);
        }
      }, 0);

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