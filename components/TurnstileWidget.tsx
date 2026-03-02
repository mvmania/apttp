import React, { useEffect, useRef } from 'react';

type TurnstileWidgetProps = {
  siteKey: string;
  action?: string;
  onTokenChange: (token: string) => void;
};

const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({ siteKey, action, onTokenChange }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    let cancelled = false;
    let widgetId: string | undefined;
    let tries = 0;

    const renderWidget = () => {
      if (cancelled || !containerRef.current) return;

      const turnstile = (window as any).turnstile;
      if (!turnstile || typeof turnstile.render !== 'function') {
        tries += 1;
        if (tries < 50) {
          setTimeout(renderWidget, 200);
        }
        return;
      }

      widgetId = turnstile.render(containerRef.current, {
        sitekey: siteKey,
        action,
        callback: (token: string) => onTokenChange(token),
        'expired-callback': () => onTokenChange(''),
        'error-callback': () => onTokenChange(''),
      });
    };

    onTokenChange('');
    renderWidget();

    return () => {
      cancelled = true;
      const turnstile = (window as any).turnstile;
      if (turnstile && widgetId && typeof turnstile.remove === 'function') {
        turnstile.remove(widgetId);
      }
    };
  }, [siteKey, action, onTokenChange]);

  return <div ref={containerRef} />;
};

export default TurnstileWidget;
