import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({});

export const useTheme = () => useContext(ThemeContext);

// Level-based color themes for 8 sub-levels
export const levelThemes = {
  'a1.1': {
    name: 'Sunrise Warmth I',
    primary: 'a1-1-primary',
    secondary: 'a1-1-secondary',
    accent: 'a1-1-accent',
    background: 'a1-1-background',
    surface: 'a1-1-surface',
    text: 'a1-1-text',
    muted: 'a1-1-muted',
    gradient: 'from-a1-1-primary to-a1-1-secondary',
    bgGradient: 'from-a1-1-background via-a1-1-surface to-a1-1-background',
  },
  'a1.2': {
    name: 'Sunrise Warmth II',
    primary: 'a1-2-primary',
    secondary: 'a1-2-secondary',
    accent: 'a1-2-accent',
    background: 'a1-2-background',
    surface: 'a1-2-surface',
    text: 'a1-2-text',
    muted: 'a1-2-muted',
    gradient: 'from-a1-2-primary to-a1-2-secondary',
    bgGradient: 'from-a1-2-background via-a1-2-surface to-a1-2-background',
  },
  'a2.1': {
    name: 'Forest Calm I',
    primary: 'a2-1-primary',
    secondary: 'a2-1-secondary',
    accent: 'a2-1-accent',
    background: 'a2-1-background',
    surface: 'a2-1-surface',
    text: 'a2-1-text',
    muted: 'a2-1-muted',
    gradient: 'from-a2-1-primary to-a2-1-secondary',
    bgGradient: 'from-a2-1-background via-a2-1-surface to-a2-1-background',
  },
  'a2.2': {
    name: 'Forest Calm II',
    primary: 'a2-2-primary',
    secondary: 'a2-2-secondary',
    accent: 'a2-2-accent',
    background: 'a2-2-background',
    surface: 'a2-2-surface',
    text: 'a2-2-text',
    muted: 'a2-2-muted',
    gradient: 'from-a2-2-primary to-a2-2-secondary',
    bgGradient: 'from-a2-2-background via-a2-2-surface to-a2-2-background',
  },
  'b1.1': {
    name: 'Ocean Depth I',
    primary: 'b1-1-primary',
    secondary: 'b1-1-secondary',
    accent: 'b1-1-accent',
    background: 'b1-1-background',
    surface: 'b1-1-surface',
    text: 'b1-1-text',
    muted: 'b1-1-muted',
    gradient: 'from-b1-1-primary to-b1-1-secondary',
    bgGradient: 'from-b1-1-background via-b1-1-surface to-b1-1-background',
  },
  'b1.2': {
    name: 'Ocean Depth II',
    primary: 'b1-2-primary',
    secondary: 'b1-2-secondary',
    accent: 'b1-2-accent',
    background: 'b1-2-background',
    surface: 'b1-2-surface',
    text: 'b1-2-text',
    muted: 'b1-2-muted',
    gradient: 'from-b1-2-primary to-b1-2-secondary',
    bgGradient: 'from-b1-2-background via-b1-2-surface to-b1-2-background',
  },
  'b2.1': {
    name: 'Twilight Elegance I',
    primary: 'b2-1-primary',
    secondary: 'b2-1-secondary',
    accent: 'b2-1-accent',
    background: 'b2-1-background',
    surface: 'b2-1-surface',
    text: 'b2-1-text',
    muted: 'b2-1-muted',
    gradient: 'from-b2-1-primary to-b2-1-secondary',
    bgGradient: 'from-b2-1-background via-b2-1-surface to-b2-1-background',
  },
  'b2.2': {
    name: 'Twilight Elegance II',
    primary: 'b2-2-primary',
    secondary: 'b2-2-secondary',
    accent: 'b2-2-accent',
    background: 'b2-2-background',
    surface: 'b2-2-surface',
    text: 'b2-2-text',
    muted: 'b2-2-muted',
    gradient: 'from-b2-2-primary to-b2-2-secondary',
    bgGradient: 'from-b2-2-background via-b2-2-surface to-b2-2-background',
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
