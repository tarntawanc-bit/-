let db;

function initIndexedDB(onSuccessCallback) {
  const req = indexedDB.open(DB_NAME, DB_VERSION);
  req.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
    }
  };
  req.onsuccess = (e) => {
    db = e.target.result;
    if (onSuccessCallback) onSuccessCallback();
  };
}

function getAllDocs(callback) {
  const tx = db.transaction(STORE_NAME, 'readonly');
  const req = tx.objectStore(STORE_NAME).getAll();
  req.onsuccess = () => callback(req.result);
}

function getDocById(id, callback) {
  const tx = db.transaction(STORE_NAME, 'readonly');
  const req = tx.objectStore(STORE_NAME).get(id);
  req.onsuccess = () => callback(req.result);
}

function saveDoc(docData, callback) {
  const tx = db.transaction(STORE_NAME, 'readwrite');
  if (docData.id) {
    tx.objectStore(STORE_NAME).put(docData);
  } else {
    tx.objectStore(STORE_NAME).add(docData);
  }
  tx.oncomplete = () => { if (callback) callback(); };
}

function deleteDocById(id, callback) {
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).delete(id);
  tx.oncomplete = () => { if (callback) callback(); };
}