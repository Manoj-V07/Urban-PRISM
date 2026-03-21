const STORAGE_KEY = "urban_prism_offline_complaint_queue_v1";

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const readQueue = () => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const list = safeParse(raw, []);
  return Array.isArray(list) ? list : [];
};

const writeQueue = (queue) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
};

const toDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image for offline queue"));
    reader.readAsDataURL(file);
  });
};

const dataUrlToBlob = async (dataUrl) => {
  const response = await fetch(dataUrl);
  return response.blob();
};

const dispatchQueueEvent = (detail) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("offline-complaint-queue", { detail }));
};

export const getOfflineComplaintQueueCount = () => readQueue().length;

export const enqueueComplaint = async ({ form, imageFile }) => {
  const imageDataUrl = await toDataUrl(imageFile);

  const queueItem = {
    id: crypto.randomUUID(),
    enqueuedAt: new Date().toISOString(),
    form,
    image: {
      name: imageFile.name,
      type: imageFile.type || "image/jpeg",
      dataUrl: imageDataUrl,
    },
    attempts: 0,
  };

  const queue = readQueue();
  queue.push(queueItem);
  writeQueue(queue);

  dispatchQueueEvent({
    type: "queued",
    queueCount: queue.length,
    itemId: queueItem.id,
  });

  return queueItem;
};

const buildFormDataFromQueueItem = async (queueItem) => {
  const formData = new FormData();

  Object.entries(queueItem.form || {}).forEach(([key, value]) => {
    formData.append(key, value ?? "");
  });

  const blob = await dataUrlToBlob(queueItem.image.dataUrl);
  const file = new File([blob], queueItem.image.name || "offline-image.jpg", {
    type: queueItem.image.type || blob.type,
  });

  formData.append("image", file);
  return formData;
};

export const flushOfflineComplaintQueue = async ({ apiClient, createEndpoint }) => {
  if (!navigator.onLine) return { synced: 0, failed: 0, remaining: getOfflineComplaintQueueCount() };

  const queue = readQueue();
  if (!queue.length) {
    return { synced: 0, failed: 0, remaining: 0 };
  }

  const remaining = [];
  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const formData = await buildFormDataFromQueueItem(item);
      await apiClient.post(createEndpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      synced += 1;
    } catch {
      remaining.push({ ...item, attempts: (item.attempts || 0) + 1 });
      failed += 1;
    }
  }

  writeQueue(remaining);

  dispatchQueueEvent({
    type: "sync-finished",
    synced,
    failed,
    queueCount: remaining.length,
  });

  return {
    synced,
    failed,
    remaining: remaining.length,
  };
};

export const setupOfflineComplaintQueueSync = ({ apiClient, createEndpoint }) => {
  const runSync = () => flushOfflineComplaintQueue({ apiClient, createEndpoint });

  const handleOnline = () => {
    runSync();
  };

  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      runSync();
    }
  };

  window.addEventListener("online", handleOnline);
  document.addEventListener("visibilitychange", handleVisibility);

  runSync();

  return () => {
    window.removeEventListener("online", handleOnline);
    document.removeEventListener("visibilitychange", handleVisibility);
  };
};
