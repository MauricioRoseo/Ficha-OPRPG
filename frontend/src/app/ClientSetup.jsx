"use client";
import { useEffect } from 'react';
import { wrapFetch } from '../lib/fetchOverride';

export default function ClientSetup() {
  useEffect(() => {
    wrapFetch();
  }, []);
  return null;
}
