export const QUOTA_KEYS = {
  YOUTUBE: 'bt_quota_youtube',
  GROQ: 'bt_quota_groq',
  DATE: 'bt_quota_date'
};

const getTodayString = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local

const checkReset = () => {
  const lastDate = localStorage.getItem(QUOTA_KEYS.DATE);
  const today = getTodayString();

  if (lastDate !== today) {
    localStorage.setItem(QUOTA_KEYS.DATE, today);
    localStorage.setItem(QUOTA_KEYS.YOUTUBE, '0');
    localStorage.setItem(QUOTA_KEYS.GROQ, '0');
    return true; // Reset happened
  }
  return false;
};

export const getQuota = () => {
  checkReset();
  return {
    youtube: parseInt(localStorage.getItem(QUOTA_KEYS.YOUTUBE) || '0', 10),
    groq: parseInt(localStorage.getItem(QUOTA_KEYS.GROQ) || '0', 10)
  };
};

export const incrementYoutube = (units) => {
  checkReset();
  const current = parseInt(localStorage.getItem(QUOTA_KEYS.YOUTUBE) || '0', 10);
  const updated = current + units;
  localStorage.setItem(QUOTA_KEYS.YOUTUBE, updated.toString());
  
  // Dispatch event for UI updates
  window.dispatchEvent(new Event('quota-updated'));
  return updated;
};

export const incrementGroq = (tokens) => {
  checkReset();
  const current = parseInt(localStorage.getItem(QUOTA_KEYS.GROQ) || '0', 10);
  const updated = current + tokens;
  localStorage.setItem(QUOTA_KEYS.GROQ, updated.toString());

  // Dispatch event for UI updates
  window.dispatchEvent(new Event('quota-updated'));
  return updated;
};
