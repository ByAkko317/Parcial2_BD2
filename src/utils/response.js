// src/utils/response.js
export const ok = (data, message = "OK") => ({ success: true, data, message });
export const fail = (error, code = 400) => ({ success: false, error, code });
