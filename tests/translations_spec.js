const english = require("../translations/en.json");
const german = require("../translations/de.json");
const spanish = require("../translations/es.json");
const french = require("../translations/fr.json");

describe("translations", () => {
  const translations = { en: english, de: german, es: spanish, fr: french };
  const englishKeys = Object.keys(english).sort();

  it.each(Object.entries(translations))(
    "%s contains every translation key",
    (_language, messages) => {
      expect(Object.keys(messages).sort()).toEqual(englishKeys);
      Object.values(messages).forEach((message) => {
        expect(message.trim()).not.toBe("");
      });
    }
  );

  it.each(Object.entries(translations))(
    "%s preserves the precipitation message placeholders",
    (_language, messages) => {
      Object.entries(messages)
        .filter(([key]) => key.startsWith("PRECIPITATION_EXPECTED_AT"))
        .forEach(([_key, message]) => {
          expect(message).toContain("{precipitation}");
          expect(message).toContain("{time}");
        });

      Object.entries(messages)
        .filter(([key]) => key.startsWith("PRECIPITATION_ENDING_BY"))
        .forEach(([_key, message]) => {
          expect(message).toContain("{precipitation}");
          expect(message).toContain("{time}");
        });
    }
  );
});
