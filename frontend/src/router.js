import { useEffect, useState } from "react";

const DEFAULT_ROUTE = "/";

export function authRoute(path, next) {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}

export function safeReturnRoute(query) {
  const next = new URLSearchParams(query).get("next");
  return next === "/teaching" || /^\/(?:facilities|plans)(?:\/\d+)?$/.test(next || "") ? next : null;
}

export function currentRoute() {
  const route = window.location.hash.replace(/^#/, "");
  return route.startsWith("/") ? route : DEFAULT_ROUTE;
}

export function navigate(route) {
  const nextHash = route.startsWith("/") ? `#${route}` : `#/${route}`;
  if (window.location.hash === nextHash) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    window.location.hash = nextHash;
  }
}

export function useRoute() {
  const [route, setRoute] = useState(currentRoute);

  useEffect(() => {
    const updateRoute = () => setRoute(currentRoute());
    window.addEventListener("hashchange", updateRoute);
    return () => window.removeEventListener("hashchange", updateRoute);
  }, []);

  return route;
}
