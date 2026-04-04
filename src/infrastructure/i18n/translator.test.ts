import { describe, it, expect, beforeEach } from 'vitest';
import { createTranslator } from './translator';

describe('Translator', () => {
  const translations = {
    en: {
      hello: 'Hello',
      greeting: 'Hello {name}!',
      nested: {
        item: 'Nested item'
      }
    },
    es: {
      hello: 'Hola',
      greeting: '¡Hola {name}!',
      nested: {
        item: 'Elemento anidado'
      }
    }
  };

  it('should translate a simple key', () => {
    const t = createTranslator('es', translations);
    expect(t('hello')).toBe('Hola');
  });

  it('should interpolate variables', () => {
    const t = createTranslator('en', translations);
    expect(t('greeting', { name: 'Jose' })).toBe('Hello Jose!');
  });

  it('should handle nested keys', () => {
    const t = createTranslator('es', translations);
    expect(t('nested.item')).toBe('Elemento anidado');
  });

  it('should fallback to default language if key is missing in current language', () => {
    const customTranslations = {
      en: { onlyEn: 'English only' },
      es: { other: 'Spanish only' }
    };
    // If we assume English is the default fallback, we should get that if Spanish key is missing
    const t = createTranslator('es', customTranslations, 'en');
    expect(t('onlyEn')).toBe('English only');
  });

  it('should return the key if not found in current or fallback language', () => {
    const t = createTranslator('en', translations);
    expect(t('missing.key')).toBe('missing.key');
  });
});
