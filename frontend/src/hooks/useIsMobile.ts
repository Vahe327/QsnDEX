'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';

const MOBILE_BREAKPOINT = 768;

function getIsMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

let listeners: Array<() => void> = [];
let currentValue = getIsMobile();

function subscribe(callback: () => void) {
  listeners.push(callback);

  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

  const handler = () => {
    const newValue = getIsMobile();
    if (newValue !== currentValue) {
      currentValue = newValue;
      listeners.forEach((fn) => fn());
    }
  };

  mql.addEventListener('change', handler);
  window.addEventListener('resize', handler);

  return () => {
    listeners = listeners.filter((fn) => fn !== callback);
    mql.removeEventListener('change', handler);
    window.removeEventListener('resize', handler);
  };
}

function getSnapshot(): boolean {
  return currentValue;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
