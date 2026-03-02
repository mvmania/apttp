export const getTurnstileSiteKey = (): string => {
  return (import.meta as any).env?.VITE_TURNSTILE_SITE_KEY || '';
};

export const getTurnstileToken = (): string => {
  const input = document.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]');
  return input?.value?.trim() || '';
};
