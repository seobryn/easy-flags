# Internationalization Utility Walkthrough

We have implemented a robust internationalization (i18n) system for Easy Flags, following **TDD** and **Hexagonal Architecture** principles.

## Core Features
1. **Multi-language Support**: Ability to define translations for any language (e.g., English, Spanish).
2. **Nested Keys**: Supports organizational structure for translations (e.g., `common.save`).
3. **Interpolation**: Dynamic variable replacement within strings (e.g., `Welcome {name}!`).
4. **Fallback Strategy**: Automatically falls back to a default language (English) if a key is missing.
5. **Astro & React Integration**: Utilities designed for both server-side Astro and client-side React.

---

## Technical Implementation

### 1. Translation Logic (`src/infrastructure/i18n/translator.ts`)
The `createTranslator` function provides a pure, agnostic translation engine. It handles:
- Traversing nested objects for keys.
- Regex-based variable interpolation.
- Safe fallbacks to prevent empty labels.

### 2. TDD Verification (`src/infrastructure/i18n/translator.test.ts`)
We followed the Red-Green-Refactor cycle:
- **Red**: First wrote tests for translation, interpolation, and nested keys.
- **Green**: Implemented logic until all tests passed.
- **Refactor**: Optimized the key traversal and interpolation regex.

### 3. Locale Structure (`src/infrastructure/i18n/locales/`)
Translations are organized by language in separate files for maintainability.
- `en.ts`: English definitions.
- `es.ts`: Spanish definitions.
- `index.ts`: Central registry for available languages.

### 4. Integration Adapters
- **Astro (`astro.ts`)**: Helps detect locale from requests (cookies/headers) and provides a `t` function for SSR.
- **React (`context.tsx`)**: Provides an `I18nProvider` and `useI18n` hook for client-side components.

---

## How to Use

### In Astro Pages (SSR)
```astro
---
import { getTranslator } from "@/infrastructure/i18n/astro";
const { t } = getTranslator(Astro.request);
---
<h1>{t('navigation.dashboard')}</h1>
```

### In React Components
```tsx
import { useTranslate } from "@/infrastructure/i18n/context";

function SaveButton() {
  const t = useTranslate();
  return <button>{t('common.save')}</button>;
}
```

### Adding New Languages
1. Create a file in `src/infrastructure/i18n/locales/` (e.g., `pt.ts`).
2. Add it to the registry in `src/infrastructure/i18n/locales/index.ts`.
