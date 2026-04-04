import { en } from './en';
import { es } from './es';
import type { LanguagesMap } from '../translator';

export const translations: LanguagesMap = {
  en,
  es
};

export type AvailableLanguages = keyof typeof translations;
export const DEFAULT_LANGUAGE: AvailableLanguages = 'en';
