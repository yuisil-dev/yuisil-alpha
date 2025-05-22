const STORAGE_KEY = 'yuisilEntries';

function getEntries() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function addEntry(entry) {
  const entries = getEntries();
  entries.push(entry);
  saveEntries(entries);
}

function updateEntry(updatedEntry) {
  const entries = getEntries();
  const index = entries.findIndex(e => e.id === updatedEntry.id);
  if (index !== -1) {
    entries[index] = updatedEntry;
    saveEntries(entries);
  }
}

function deleteEntry(id) {
  const entries = getEntries();
  const filteredEntries = entries.filter(e => e.id !== id);
  saveEntries(filteredEntries);
}

export {
  getEntries,
  saveEntries,
  addEntry,
  updateEntry,
  deleteEntry
}; 