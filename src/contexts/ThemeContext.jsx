import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({});

export const useTheme = () => useContext(ThemeContext);

// Level identity for the 8 sub-levels.
//
// This used to carry a full per-level palette (primary/secondary/accent/
// gradient…). Those fields were the app's level-colour system, which
// design-tokens.js rule 1 forbids — colour means CASE, never level — and by
// the end of the 2026-09 design sweep nothing rendered them any more, while
// their class strings still forced Tailwind to emit the eight CEFR palettes
// into the bundle. Only the display name remains; a level is shown as a chip.
export const levelThemes = {
  'a1.1': {
    name: 'Sunrise Warmth I',
  },
  'a1.2': {
    name: 'Sunrise Warmth II',
  },
  'a2.1': {
    name: 'Forest Calm I',
  },
  'a2.2': {
    name: 'Forest Calm II',
  },
  'b1.1': {
    name: 'Ocean Depth I',
  },
  'b1.2': {
    name: 'Ocean Depth II',
  },
  'b2.1': {
    name: 'Twilight Elegance I',
  },
  'b2.2': {
    name: 'Twilight Elegance II',
  },
  default: {
    name: 'Default',
  },
};

export const ThemeProvider = ({ children }) => {
  const [currentLevel, setCurrentLevel] = useState(null);
  const [theme, setTheme] = useState(levelThemes.default);

  useEffect(() => {
    if (currentLevel && levelThemes[currentLevel]) {
      setTheme(levelThemes[currentLevel]);
    } else {
      setTheme(levelThemes.default);
    }
  }, [currentLevel]);

  const getThemeForLevel = (level) => {
    return levelThemes[level] || levelThemes.default;
  };

  const value = {
    currentLevel,
    setCurrentLevel,
    theme,
    getThemeForLevel,
    levelThemes,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
