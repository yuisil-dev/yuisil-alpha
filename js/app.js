import { showForm, saveEntry, renderEntries } from './ui.js';

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  // ボタンのイベントリスナー設定
  document.querySelector('button[onclick="showForm(\'sent\')"]').onclick = () => showForm('sent');
  document.querySelector('button[onclick="showForm(\'received\')"]').onclick = () => showForm('received');
  document.querySelector('button[onclick="saveEntry()"]').onclick = saveEntry;

  // 初期表示
  renderEntries();
}); 