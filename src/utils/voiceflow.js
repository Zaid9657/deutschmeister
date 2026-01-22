// Voiceflow Configuration
// This is a placeholder configuration for Voiceflow integration
// Replace with actual Voiceflow credentials when available

export const voiceflowConfig = {
  // Replace these with your actual Voiceflow credentials
  apiKey: 'YOUR_VOICEFLOW_API_KEY',
  projectId: 'YOUR_PROJECT_ID',
  versionId: 'production',

  // API endpoints
  endpoints: {
    interact: 'https://general-runtime.voiceflow.com/state/user/{userId}/interact',
    state: 'https://general-runtime.voiceflow.com/state/user/{userId}',
  },
};

// Generate a unique user ID for Voiceflow sessions
export const generateUserId = () => {
  const stored = localStorage.getItem('voiceflow_user_id');
  if (stored) return stored;

  const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('voiceflow_user_id', newId);
  return newId;
};

// Placeholder function for sending messages to Voiceflow
// Replace with actual implementation when API key is available
export const sendMessage = async (message, userId) => {
  // Placeholder responses for demonstration
  const placeholderResponses = {
    default: [
      {
        type: 'text',
        message: 'Hallo! Ich bin dein Deutsch-Lernassistent. Wie kann ich dir heute helfen?',
      },
    ],
    greeting: [
      {
        type: 'text',
        message: 'Hallo! Schön, dich zu sehen! Wie geht es dir heute?',
      },
    ],
    help: [
      {
        type: 'text',
        message: 'Ich kann dir helfen mit: Vokabeln üben, Grammatik erklären, oder einfach auf Deutsch plaudern. Was möchtest du machen?',
      },
    ],
  };

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Simple keyword matching for demo
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('hallo') || lowerMessage.includes('hi') || lowerMessage.includes('guten')) {
    return placeholderResponses.greeting;
  }
  if (lowerMessage.includes('hilfe') || lowerMessage.includes('help')) {
    return placeholderResponses.help;
  }

  return placeholderResponses.default;
};

// Reset conversation state
export const resetConversation = async (userId) => {
  localStorage.removeItem('voiceflow_user_id');
  return { success: true };
};

// Note: When integrating with actual Voiceflow API, replace sendMessage with:
/*
export const sendMessage = async (message, userId) => {
  const response = await fetch(
    voiceflowConfig.endpoints.interact.replace('{userId}', userId),
    {
      method: 'POST',
      headers: {
        'Authorization': voiceflowConfig.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: {
          type: 'text',
          payload: message,
        },
        config: {
          tts: false,
          stripSSML: true,
        },
      }),
    }
  );

  return response.json();
};
*/
