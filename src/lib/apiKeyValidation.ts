export function showErrorToast(message: string) {
  // Prevent spamming multiple toasts
  const existing = document.getElementById("api-key-error-toast");
  if (existing) {
    existing.innerText = message;
    return;
  }
  const toast = document.createElement('div');
  toast.id = "api-key-error-toast";
  toast.className = `fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-xl text-white font-bold text-sm z-50 transition-opacity duration-300 bg-rose-600 border border-rose-400`;
  toast.innerText = message;
  toast.style.direction = 'rtl';
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 4000);
}

export function validateApiKeyFormat(key: string): boolean {
  if (!key || key.trim() === "") return false;
  const trimmed = key.trim();
  // Validates if it starts with AIza, AQ., or sk-or-
  return trimmed.startsWith("AIza") || trimmed.startsWith("AQ.") || trimmed.startsWith("sk-or-");
}

export function saveApiKeyWithValidation(key: string, storageName: string) {
  if (!key || key.trim() === "") {
    localStorage.removeItem(storageName);
    return;
  }
  
  if (validateApiKeyFormat(key)) {
    localStorage.setItem(storageName, key.trim());
  } else {
    // Show error toast only if user typed enough characters or it's clearly invalid and long enough
    if (key.length >= 10) {
      showErrorToast("فرمت کلید نامعتبر است. فقط کلیدهای Google Gemini یا OpenRouter پشتیبانی می‌شوند.");
    }
  }
}
