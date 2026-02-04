import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      nav: {
        home: 'Home',
        dashboard: 'Dashboard',
        grammar: 'Grammar',
        reading: 'Reading',
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
        'a1.1': {
          name: 'A1.1 - Beginner I',
          theme: 'Sunrise Warmth I',
          description: 'Your first steps in German: basic greetings and essential words.',
        },
        'a1.2': {
          name: 'A1.2 - Beginner II',
          theme: 'Sunrise Warmth II',
          description: 'Building your foundation with family, time, and daily expressions.',
        },
        'a2.1': {
          name: 'A2.1 - Elementary I',
          theme: 'Forest Calm I',
          description: 'Exploring everyday German: work, travel, and daily activities.',
        },
        'a2.2': {
          name: 'A2.2 - Elementary II',
          theme: 'Forest Calm II',
          description: 'Deepening your roots with social situations and conversations.',
        },
        'b1.1': {
          name: 'B1.1 - Intermediate I',
          theme: 'Ocean Depth I',
          description: 'Diving into fluency with opinions, career, and society topics.',
        },
        'b1.2': {
          name: 'B1.2 - Intermediate II',
          theme: 'Ocean Depth II',
          description: 'Navigating complex waters with advanced grammar structures.',
        },
        'b2.1': {
          name: 'B2.1 - Upper Intermediate I',
          theme: 'Twilight Elegance I',
          description: 'Refining your expression with formal and academic German.',
        },
        'b2.2': {
          name: 'B2.2 - Upper Intermediate II',
          theme: 'Twilight Elegance II',
          description: 'Mastering the language with sophisticated expressions.',
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
        reading: 'Reading',
        markRead: 'Mark as Read',
        read: 'Read',
        showTranslation: 'Show translation',
        hideTranslation: 'Hide translation',
        words: 'words',
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
        grammar: 'Grammatik',
        reading: 'Lesen',
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
        'a1.1': {
          name: 'A1.1 - Anfänger I',
          theme: 'Sonnenaufgang Wärme I',
          description: 'Deine ersten Schritte auf Deutsch: Begrüßungen und wichtige Wörter.',
        },
        'a1.2': {
          name: 'A1.2 - Anfänger II',
          theme: 'Sonnenaufgang Wärme II',
          description: 'Dein Fundament aufbauen mit Familie, Zeit und Alltagsausdrücken.',
        },
        'a2.1': {
          name: 'A2.1 - Grundstufe I',
          theme: 'Waldruhe I',
          description: 'Alltägliches Deutsch entdecken: Arbeit, Reisen und tägliche Aktivitäten.',
        },
        'a2.2': {
          name: 'A2.2 - Grundstufe II',
          theme: 'Waldruhe II',
          description: 'Deine Wurzeln vertiefen mit sozialen Situationen und Gesprächen.',
        },
        'b1.1': {
          name: 'B1.1 - Mittelstufe I',
          theme: 'Meerestiefe I',
          description: 'In die Sprachgewandtheit eintauchen mit Meinungen, Karriere und Gesellschaft.',
        },
        'b1.2': {
          name: 'B1.2 - Mittelstufe II',
          theme: 'Meerestiefe II',
          description: 'Durch komplexe Gewässer navigieren mit fortgeschrittenen Grammatikstrukturen.',
        },
        'b2.1': {
          name: 'B2.1 - Obere Mittelstufe I',
          theme: 'Dämmerungseleganz I',
          description: 'Deinen Ausdruck verfeinern mit formellem und akademischem Deutsch.',
        },
        'b2.2': {
          name: 'B2.2 - Obere Mittelstufe II',
          theme: 'Dämmerungseleganz II',
          description: 'Die Sprache meistern mit anspruchsvollen Ausdrücken.',
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
        reading: 'Lesen',
        markRead: 'Als gelesen markieren',
        read: 'Gelesen',
        showTranslation: 'Übersetzung zeigen',
        hideTranslation: 'Übersetzung verbergen',
        words: 'Wörter',
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
