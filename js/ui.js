import { getEntries, addEntry, updateEntry, deleteEntry } from './storage.js';

/** @type {'sent' | 'received'} */
let mode = "sent";
let selectedRelatedEntries = new Set();

// シェア機能の実装
let currentShareEntry = null;
let lastShareSettings = {
  showName: true,
  showContent: true
};

// ランダム感想文のデータ
const randomThoughts = {
  sent: [
    "喜んでもらえたみたいで、私もうれしかった。",
    "相手の笑顔を思い浮かべながら選びました。",
    "これが少しでも力になればと思って。",
    "以前から贈りたいと思っていたものです。",
    "気持ちが伝わるといいなと思って渡しました。",
    "心を込めて選びました。",
    "どんなふうに使ってくれるか、想像するのも楽しいです。",
    "贈る側の私も、あたたかい気持ちになりました。",
    "渡したときの表情が忘れられません。",
    "喜んで受け取ってもらえて、ほんとうによかった。"
  ],
  received: [
    "思いがけないタイミングで、心がほぐれました。",
    "大切にしようと思える贈りものです。",
    "やさしさがまっすぐ伝わってきました。",
    "温かい気持ちになりました。今でもふと思い出します。",
    "自分を気にかけてくれる人がいることに、改めて感謝。",
    "贈りものって、ほんとうに人を元気にするものですね。",
    "言葉にしきれないくらい嬉しかったです。",
    "普段は言えない「ありがとう」を、ちゃんと伝えたくなりました。",
    "これを見るたびに、その時の気持ちがよみがえります。",
    "気持ちのこもった贈り物に、心からありがとうを伝えたい。"
  ]
};

function showForm(selected, entry = null) {
  // 編集時はentry.typeを優先、それ以外はselectedの値を使用
  mode = entry?.type || selected;
  const formArea = document.getElementById("formArea");
  const formTitle = document.getElementById("formTitle");
  const receivedBtn = document.getElementById("receivedBtn");
  
  formArea.style.display = "block";
  formArea.className = mode === "sent" ? "" : "received-mode";
  formTitle.textContent = mode === "sent" ? "贈った記録" : "受け取った記録";
  receivedBtn.style.display = mode === "sent" ? "block" : "none";
  
  if (entry) {
    document.getElementById("editingId").value = entry.id;
    document.getElementById("partner").value = entry.partner;
    document.getElementById("title").value = entry.title || "";
    document.getElementById("date").value = entry.date;
    document.getElementById("content").value = entry.content;
    selectedRelatedEntries = new Set(entry.relatedEntries || []);
  } else {
    document.getElementById("editingId").value = "";
    document.getElementById("partner").value = "";
    document.getElementById("title").value = "";
    
    // 今日の日付を初期値として設定
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
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

  // Track form display
  trackUIClick(mode === 'sent' ? 'send_button' : 'receive_button', mode, 'button');
}

function updateRelatedGiftsList() {
  const list = document.getElementById("relatedGiftsList");
  list.innerHTML = "";
  const entries = getEntries();
  const partner = document.getElementById("partner").value.trim();
  
  const relatedEntries = entries.filter(e => 
    e.partner === partner && 
    e.id !== document.getElementById("editingId").value &&
    e.type !== mode
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  if (relatedEntries.length === 0) {
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "empty-message";
    emptyMessage.textContent = mode === 'sent' 
      ? "同じ相手から受け取った贈り物（お返し）を関連付けられます"
      : "同じ相手に贈った贈り物（お返し）を関連付けられます";
    list.appendChild(emptyMessage);
    return;
  }

  relatedEntries.forEach(e => {
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
  
  // 新規作成時のみシェアモーダルを表示
  if (!editingId) {
    showShareModal(newEntry);
  }

  // Track save action
  trackUIClick('save_button', mode, 'button');
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

function generateShareText(entry, showName = true, showContent = true) {
  const baseUrl = 'https://yuisil-alpha.vercel.app/';
  const articleUrl = 'https://note.com/yuisil_team/n/n123456789abc';
  
  // 基本構文の開始部分
  let text = ``;
  
  // カテゴリに応じた絵文字と本文
  if (entry.type === 'sent') {
    const nameText = showName ? `${entry.partner}さんに` : '';
    text += `🎁 ${nameText}${entry.title}を贈りました。`;
  } else {
    const nameText = showName ? `${entry.partner}さんから` : '';
    text += `💐 ${nameText}${entry.title}をいただきました。`;
  }
  
  // ランダム感想文を追加
  if (entry.randomThought) {
    text += `\n${entry.randomThought}`;
  }

  // メモがある場合は追加
  if (showContent && entry.content) {
    text += `\n${entry.content}`;
  }

  // 共通のフッター部分
  text += `\n\nユイシルで記録しています。\n📖紹介記事：${articleUrl}\n🔗アプリ：${baseUrl}\n#ユイシル #ありがとうの記録`;
  
  return text;
}

function getRandomThought(type) {
  const thoughts = randomThoughts[type];
  return thoughts[Math.floor(Math.random() * thoughts.length)];
}

function showShareModal(entry) {
  currentShareEntry = entry;
  const modal = document.getElementById('shareModal');
  const shareText = document.getElementById('shareText');
  const nameToggle = document.getElementById('nameToggle');
  const contentToggle = document.getElementById('contentToggle');
  
  // 前回の設定を反映
  nameToggle.checked = lastShareSettings.showName;
  contentToggle.checked = lastShareSettings.showContent;
  
  // ランダム感想文を生成
  if (!entry.randomThought) {
    entry.randomThought = getRandomThought(entry.type);
  }
  
  // シェアテキストを生成して設定
  shareText.value = generateShareText(entry, lastShareSettings.showName, lastShareSettings.showContent);
  
  // シェアボタンのURLを設定
  const encodedText = encodeURIComponent(shareText.value);
  document.getElementById('twitterShareBtn').href = `https://twitter.com/intent/tweet?text=${encodedText}`;
  document.getElementById('facebookShareBtn').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodedText}`;
  document.getElementById('lineShareBtn').href = `https://line.me/R/share?text=${encodedText}`;
  
  // モーダルを表示
  modal.style.display = 'flex';
  
  // モーダルの外側クリックで閉じる
  modal.onclick = (event) => {
    if (event.target === modal) {
      closeShareModal();
    }
  };

  // ESCキーで閉じる
  document.addEventListener('keydown', handleEscKey);
}

function handleEscKey(event) {
  if (event.key === 'Escape') {
    closeShareModal();
  }
}

function closeShareModal() {
  const modal = document.getElementById('shareModal');
  if (!modal) return;
  
  modal.style.display = 'none';
  currentShareEntry = null;
  
  // ESCキーのイベントリスナーを削除
  document.removeEventListener('keydown', handleEscKey);
  
  // モーダルの外側クリックイベントを削除
  modal.onclick = null;
}

function toggleNameDisplay() {
  if (!currentShareEntry) return;
  const showName = document.getElementById('nameToggle').checked;
  const showContent = document.getElementById('contentToggle').checked;
  
  // 設定を保存
  lastShareSettings.showName = showName;
  lastShareSettings.showContent = showContent;
  
  const shareText = document.getElementById('shareText');
  shareText.value = generateShareText(currentShareEntry, showName, showContent);
  
  // シェアボタンのURLを更新
  const encodedText = encodeURIComponent(shareText.value);
  document.getElementById('twitterShareBtn').href = `https://twitter.com/intent/tweet?text=${encodedText}`;
  document.getElementById('facebookShareBtn').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodedText}`;
  document.getElementById('lineShareBtn').href = `https://line.me/R/share?text=${encodedText}`;
}

function copyShareText() {
  const shareText = document.getElementById('shareText');
  shareText.select();
  
  try {
    document.execCommand('copy');
    alert('テキストをコピーしました');
  } catch (err) {
    console.error('クリップボードへのコピーに失敗しました:', err);
    alert('テキストのコピーに失敗しました');
  }
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

function regenerateRandomThought() {
  if (!currentShareEntry) return;
  
  currentShareEntry.randomThought = getRandomThought(currentShareEntry.type);
  const shareText = document.getElementById('shareText');
  shareText.value = generateShareText(
    currentShareEntry,
    document.getElementById('nameToggle').checked,
    document.getElementById('contentToggle').checked
  );
  
  // シェアボタンのURLを更新
  const encodedText = encodeURIComponent(shareText.value);
  document.getElementById('twitterShareBtn').href = `https://twitter.com/intent/tweet?text=${encodedText}`;
  document.getElementById('facebookShareBtn').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodedText}`;
  document.getElementById('lineShareBtn').href = `https://line.me/R/share?text=${encodedText}`;
}

// イベントリスナーの設定
document.getElementById("partner").addEventListener("input", updateRelatedGiftsList);

// モーダル関連のイベントリスナー
document.addEventListener('DOMContentLoaded', () => {
  // 下部の閉じるボタン
  const modalBottomCloseBtn = document.getElementById('modalBottomCloseBtn');
  if (modalBottomCloseBtn) {
    modalBottomCloseBtn.addEventListener('click', closeShareModal);
  }

  // 名前表示トグル
  const nameToggle = document.getElementById('nameToggle');
  if (nameToggle) {
    nameToggle.addEventListener('change', toggleNameDisplay);
  }

  // コンテンツ表示トグル
  const contentToggle = document.getElementById('contentToggle');
  if (contentToggle) {
    contentToggle.addEventListener('change', toggleNameDisplay);
  }

  // コピーボタン
  const copyShareTextBtn = document.getElementById('copyShareTextBtn');
  if (copyShareTextBtn) {
    copyShareTextBtn.addEventListener('click', copyShareText);
  }

  // ランダム感想文再生成ボタン
  const regenerateThoughtBtn = document.getElementById('regenerateThoughtBtn');
  if (regenerateThoughtBtn) {
    regenerateThoughtBtn.addEventListener('click', regenerateRandomThought);
  }
});

// Add tracking to toggle switches
document.getElementById('nameToggle').addEventListener('change', function() {
  trackUIClick('name_toggle', currentShareEntry?.type || null, 'checkbox');
  updateShareText();
});

document.getElementById('contentToggle').addEventListener('change', function() {
  trackUIClick('content_toggle', currentShareEntry?.type || null, 'checkbox');
  updateShareText();
});

// Add tracking to share buttons
document.getElementById('copyShareTextBtn').addEventListener('click', function() {
  trackUIClick('copy_share', currentShareEntry?.type || null, 'button');
  copyShareText();
});

document.getElementById('regenerateThoughtBtn').addEventListener('click', function() {
  trackUIClick('regenerate_thought', currentShareEntry?.type || null, 'button');
  regenerateThought();
});

// Add tracking to social share buttons
document.getElementById('twitterShareBtn').addEventListener('click', function() {
  trackUIClick('twitter_share', currentShareEntry?.type || null, 'button');
});

document.getElementById('facebookShareBtn').addEventListener('click', function() {
  trackUIClick('facebook_share', currentShareEntry?.type || null, 'button');
});

document.getElementById('lineShareBtn').addEventListener('click', function() {
  trackUIClick('line_share', currentShareEntry?.type || null, 'button');
});

export {
  showForm,
  saveEntry,
  renderEntries,
  closeShareModal
};