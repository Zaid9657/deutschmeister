import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({});

export const useTheme = () => useContext(ThemeContext);

// Level-based color themes
export const levelThemes = {
  a1: {
    name: 'Sunrise Warmth',
    primary: 'a1-primary',
    secondary: 'a1-secondary',
    accent: 'a1-accent',
    background: 'a1-background',
    surface: 'a1-surface',
    text: 'a1-text',
    muted: 'a1-muted',
    gradient: 'from-a1-primary to-a1-secondary',
    bgGradient: 'from-a1-background via-a1-surface to-a1-background',
  },
  a2: {
    name: 'Forest Calm',
    primary: 'a2-primary',
    secondary: 'a2-secondary',
    accent: 'a2-accent',
    background: 'a2-background',
    surface: 'a2-surface',
    text: 'a2-text',
    muted: 'a2-muted',
    gradient: 'from-a2-primary to-a2-secondary',
    bgGradient: 'from-a2-background via-a2-surface to-a2-background',
  },
  b1: {
    name: 'Ocean Depth',
    primary: 'b1-primary',
    secondary: 'b1-secondary',
    accent: 'b1-accent',
    background: 'b1-background',
    surface: 'b1-surface',
    text: 'b1-text',
    muted: 'b1-muted',
    gradient: 'from-b1-primary to-b1-secondary',
    bgGradient: 'from-b1-background via-b1-surface to-b1-background',
  },
  b2: {
    name: 'Twilight Elegance',
    primary: 'b2-primary',
    secondary: 'b2-secondary',
    accent: 'b2-accent',
    background: 'b2-background',
    surface: 'b2-surface',
    text: 'b2-text',
    muted: 'b2-muted',
    gradient: 'from-b2-primary to-b2-secondary',
    bgGradient: 'from-b2-background via-b2-surface to-b2-background',
  },
  default: {
    name: 'Default',
    primary: 'slate-700',
    secondary: 'slate-500',
    accent: 'blue-500',
    background: 'slate-50',
    surface: 'white',
    text: 'slate-900',
    muted: 'slate-500',
    gradient: 'from-slate-700 to-slate-500',
    bgGradient: 'from-slate-50 via-white to-slate-50',
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
