import { useEffect, useState } from 'react';

export interface RouteState {
  path: string;
  query: URLSearchParams;
}

function parse(): RouteState {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  const [path, qs = ''] = hash.split('?');
  return { path: path || '/', query: new URLSearchParams(qs) };
}

export function navigate(path: string) {
  if (window.location.hash === `#${path}`) return;
  window.location.hash = path;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function useRoute(): RouteState {
  const [route, setRoute] = useState<RouteState>(() => parse());
  useEffect(() => {
    const onChange = () => setRoute(parse());
    window.addEventListener('hashchange', onChange);
    if (!window.location.hash) window.location.hash = '/';
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function Link({
  to,
  children,
  className,
  onClick,
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <a
      href={`#${to}`}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
        onClick?.();
      }}
    >
      {children}
    </a>
  );
}
