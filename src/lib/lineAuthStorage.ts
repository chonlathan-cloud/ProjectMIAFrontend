const TOKEN_KEY = 'cb_line_token';
const SHOP_KEY = 'cb_line_shop_id';
const LINE_USER_KEY = 'cb_line_user_id';

const readFromStorage = (key: string) => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(key) || localStorage.getItem(key);
};

export const getStoredToken = () => {
  const token = readFromStorage(TOKEN_KEY);
  if (token && typeof window !== 'undefined') {
    if (!sessionStorage.getItem(TOKEN_KEY)) {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(TOKEN_KEY);
    }
  }
  return token;
};

export const setStoredToken = (token: string) => {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(TOKEN_KEY, token);
  localStorage.removeItem(TOKEN_KEY);
};

export const clearStoredToken = () => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
};

export const getStoredShopId = () => readFromStorage(SHOP_KEY);

export const setStoredShopId = (shopId: string) => {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SHOP_KEY, shopId);
  localStorage.setItem(SHOP_KEY, shopId);
};

export const getStoredLineUserId = () => readFromStorage(LINE_USER_KEY);

export const setStoredLineUserId = (lineUserId: string) => {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(LINE_USER_KEY, lineUserId);
  localStorage.setItem(LINE_USER_KEY, lineUserId);
};

export const clearLineSession = () => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SHOP_KEY);
  sessionStorage.removeItem(LINE_USER_KEY);
  localStorage.removeItem(SHOP_KEY);
  localStorage.removeItem(LINE_USER_KEY);
  clearStoredToken();
};
