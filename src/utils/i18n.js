import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      nav: {
        home: 'Home',
        dashboard: 'Dashboard',
        profile: 'Profile',
        login: 'Login',
        signup: 'Sign Up',
        logout: 'Logout',
      },
      // Landing Page
      landing: {
        title: 'Master German with DeutschMeister',
        subtitle: 'Your journey to fluency starts here. Learn German through structured levels, interactive exercises, and speaking practice.',
        getStarted: 'Get Started',
        login: 'Login',
        features: {
          title: 'Why Choose DeutschMeister?',
          levels: {
            title: 'Structured Levels',
            description: 'Progress through A1 to B2 with carefully curated content',
          },
          vocabulary: {
            title: 'Rich Vocabulary',
            description: 'Learn words with examples, pronunciation, and context',
          },
          grammar: {
            title: 'Clear Grammar',
            description: 'Understand German grammar with simple explanations',
          },
          speaking: {
            title: 'Speaking Practice',
            description: 'Practice conversation with our AI assistant',
          },
        },
      },
      // Auth
      auth: {
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        login: 'Login',
        signup: 'Sign Up',
        forgotPassword: 'Forgot Password?',
        resetPassword: 'Reset Password',
        updatePassword: 'Update Password',
        newPassword: 'New Password',
        noAccount: "Don't have an account?",
        hasAccount: 'Already have an account?',
        sendResetLink: 'Send Reset Link',
        checkEmail: 'Check your email for the reset link',
        passwordUpdated: 'Password updated successfully',
        verifyEmail: 'Please verify your email to continue',
      },
      // Dashboard
      dashboard: {
        title: 'Your Learning Journey',
        subtitle: 'Track your progress and continue learning',
        progress: 'Progress',
        locked: 'Locked',
        unlockRequirement: 'Complete {{percent}}% of {{level}} to unlock',
        continue: 'Continue',
        start: 'Start',
      },
      // Levels
      levels: {
        a1: {
          name: 'A1 - Beginner',
          theme: 'Sunrise Warmth',
          description: 'Start your German journey with basics: greetings, numbers, and everyday phrases.',
        },
        a2: {
          name: 'A2 - Elementary',
          theme: 'Forest Calm',
          description: 'Expand your vocabulary with daily life topics and simple conversations.',
        },
        b1: {
          name: 'B1 - Intermediate',
          theme: 'Ocean Depth',
          description: 'Dive deeper into German with complex sentences and professional topics.',
        },
        b2: {
          name: 'B2 - Upper Intermediate',
          theme: 'Twilight Elegance',
          description: 'Master advanced grammar and express yourself fluently.',
        },
      },
      // Level Page
      levelPage: {
        vocabulary: 'Vocabulary',
        sentences: 'Sentences',
        grammar: 'Grammar',
        audio: 'Audio',
        speaking: 'Speaking',
        learned: 'Learned',
        markLearned: 'Mark as Learned',
        example: 'Example',
        translation: 'Translation',
        rule: 'Rule',
        explanation: 'Explanation',
        listenPronunciation: 'Listen to pronunciation',
        practiceConversation: 'Practice conversation with AI',
      },
      // Profile
      profile: {
        title: 'Your Profile',
        memberSince: 'Member since',
        totalProgress: 'Total Progress',
        wordsLearned: 'Words Learned',
        sentencesLearned: 'Sentences Learned',
        grammarLearned: 'Grammar Rules Learned',
        settings: 'Settings',
        language: 'Language',
        deleteAccount: 'Delete Account',
      },
      // Speaking Practice
      speaking: {
        title: 'Speaking Practice',
        placeholder: 'Type your message in German...',
        send: 'Send',
        voiceflowNote: 'Powered by Voiceflow AI',
        suggestions: {
          title: 'Try saying:',
          greeting: 'Hallo, wie geht es dir?',
          introduce: 'Ich heiße...',
          ask: 'Was machst du gerne?',
        },
      },
      // Common
      common: {
        loading: 'Loading...',
        error: 'An error occurred',
        save: 'Save',
        cancel: 'Cancel',
        back: 'Back',
        next: 'Next',
        complete: 'Complete',
      },
    },
  },
  de: {
    translation: {
      // Navigation
      nav: {
        home: 'Startseite',
        dashboard: 'Dashboard',
        profile: 'Profil',
        login: 'Anmelden',
        signup: 'Registrieren',
        logout: 'Abmelden',
      },
      // Landing Page
      landing: {
        title: 'Deutsch meistern mit DeutschMeister',
        subtitle: 'Deine Reise zur Sprachgewandtheit beginnt hier. Lerne Deutsch durch strukturierte Stufen, interaktive Übungen und Sprechpraxis.',
        getStarted: 'Jetzt starten',
        login: 'Anmelden',
        features: {
          title: 'Warum DeutschMeister?',
          levels: {
            title: 'Strukturierte Stufen',
            description: 'Fortschritt von A1 bis B2 mit sorgfältig ausgewählten Inhalten',
          },
          vocabulary: {
            title: 'Reicher Wortschatz',
            description: 'Lerne Wörter mit Beispielen, Aussprache und Kontext',
          },
          grammar: {
            title: 'Klare Grammatik',
            description: 'Verstehe deutsche Grammatik mit einfachen Erklärungen',
          },
          speaking: {
            title: 'Sprechübungen',
            description: 'Übe Konversation mit unserem KI-Assistenten',
          },
        },
      },
      // Auth
      auth: {
        email: 'E-Mail',
        password: 'Passwort',
        confirmPassword: 'Passwort bestätigen',
        login: 'Anmelden',
        signup: 'Registrieren',
        forgotPassword: 'Passwort vergessen?',
        resetPassword: 'Passwort zurücksetzen',
        updatePassword: 'Passwort aktualisieren',
        newPassword: 'Neues Passwort',
        noAccount: 'Noch kein Konto?',
        hasAccount: 'Bereits ein Konto?',
        sendResetLink: 'Link senden',
        checkEmail: 'Überprüfe deine E-Mail für den Link',
        passwordUpdated: 'Passwort erfolgreich aktualisiert',
        verifyEmail: 'Bitte bestätige deine E-Mail um fortzufahren',
      },
      // Dashboard
      dashboard: {
        title: 'Deine Lernreise',
        subtitle: 'Verfolge deinen Fortschritt und lerne weiter',
        progress: 'Fortschritt',
        locked: 'Gesperrt',
        unlockRequirement: 'Schließe {{percent}}% von {{level}} ab zum Freischalten',
        continue: 'Fortsetzen',
        start: 'Starten',
      },
      // Levels
      levels: {
        a1: {
          name: 'A1 - Anfänger',
          theme: 'Sonnenaufgangswärme',
          description: 'Beginne deine Deutschreise mit Grundlagen: Begrüßungen, Zahlen und Alltagsphrasen.',
        },
        a2: {
          name: 'A2 - Grundstufe',
          theme: 'Waldruhe',
          description: 'Erweitere deinen Wortschatz mit Alltagsthemen und einfachen Gesprächen.',
        },
        b1: {
          name: 'B1 - Mittelstufe',
          theme: 'Meerestiefe',
          description: 'Tauche tiefer in die deutsche Sprache mit komplexen Sätzen und beruflichen Themen.',
        },
        b2: {
          name: 'B2 - Obere Mittelstufe',
          theme: 'Dämmerungseleganz',
          description: 'Meistere fortgeschrittene Grammatik und drücke dich fließend aus.',
        },
      },
      // Level Page
      levelPage: {
        vocabulary: 'Wortschatz',
        sentences: 'Sätze',
        grammar: 'Grammatik',
        audio: 'Audio',
        speaking: 'Sprechen',
        learned: 'Gelernt',
        markLearned: 'Als gelernt markieren',
        example: 'Beispiel',
        translation: 'Übersetzung',
        rule: 'Regel',
        explanation: 'Erklärung',
        listenPronunciation: 'Aussprache anhören',
        practiceConversation: 'Konversation mit KI üben',
      },
      // Profile
      profile: {
        title: 'Dein Profil',
        memberSince: 'Mitglied seit',
        totalProgress: 'Gesamtfortschritt',
        wordsLearned: 'Wörter gelernt',
        sentencesLearned: 'Sätze gelernt',
        grammarLearned: 'Grammatikregeln gelernt',
        settings: 'Einstellungen',
        language: 'Sprache',
        deleteAccount: 'Konto löschen',
      },
      // Speaking Practice
      speaking: {
        title: 'Sprechübung',
        placeholder: 'Schreibe deine Nachricht auf Deutsch...',
        send: 'Senden',
        voiceflowNote: 'Unterstützt von Voiceflow KI',
        suggestions: {
          title: 'Versuche zu sagen:',
          greeting: 'Hallo, wie geht es dir?',
          introduce: 'Ich heiße...',
          ask: 'Was machst du gerne?',
        },
      },
      // Common
      common: {
        loading: 'Laden...',
        error: 'Ein Fehler ist aufgetreten',
        save: 'Speichern',
        cancel: 'Abbrechen',
        back: 'Zurück',
        next: 'Weiter',
        complete: 'Abschließen',
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
