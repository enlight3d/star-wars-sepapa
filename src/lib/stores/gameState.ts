import { writable } from 'svelte/store';

export const currentStep = writable(0);
export const modelLoaded = writable(false);
export const modelProgress = writable(0);
export const audioEnabled = writable(false);
