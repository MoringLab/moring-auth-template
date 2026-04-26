
import { GoogleGenAI } from "@google/genai";
import { ReliabilityReport, RoutineItem, ChecklistItem, Phrase, BudgetData, Language, DiagnosticResult, DiagnosticQuestion, DiagnosticAnswer, SimulationScenario, QuizQuestion, QuizDifficulty, QuizType, Character, SimulationTurn } from "@/types";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to force JSON response
const jsonConfig = { responseMimeType: 'application/json' };

// Helper string for strict language instruction
const getLangInstruction = (lang: Language) =>
  lang === 'ko'
    ? "IMPORTANT: Output MUST be in KOREAN (한국어)."
    : "IMPORTANT: Output MUST be in ENGLISH.";

export const analyzeReliability = async (textDetails: string, fileBase64: string | null, mimeType: string | null, lang: Language): Promise<ReliabilityReport> => {
  try {
    const prompt = `
      Analyze the provided study abroad program materials.
      ${getLangInstruction(lang)}
      Role: Expert Study Abroad Auditor.

      Task:
      1. Extract included/excluded items.
      2. Identify hidden costs.
      3. Detect red flags.
      4. Give a reliability score (0-100).

      IMPORTANT: In the 'summary', use **bold** syntax for key findings. The summary MUST be written in ${lang === 'ko' ? 'Korean' : 'English'}.

      Input Text: "${textDetails}"
      ${fileBase64 ? "(A document is attached for analysis)" : ""}

      Return JSON:
      {
        "score": number,
        "verdict": "Safe" | "Caution" | "High Risk",
        "included": string[],
        "excluded": string[],
        "hiddenCosts": string[],
        "redFlags": string[],
        "summary": "string with **bold** markup"
      }
    `;

    const parts: { text?: string; inlineData?: { data: string; mimeType: string } }[] = [{ text: prompt }];

    if (fileBase64 && mimeType) {
      parts.push({
        inlineData: {
          data: fileBase64,
          mimeType: mimeType
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: jsonConfig
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Reliability analysis failed", error);
    return {
      score: 0,
      verdict: 'Caution',
      included: [],
      excluded: [],
      hiddenCosts: [],
      redFlags: ['Analysis Failed'],
      summary: 'Could not process the request.'
    };
  }
};

export const generateDiagnosticQuestions = async (
  role: 'student' | 'parent',
  lang: Language,
  context: { destination: string; duration: string; details: string }
): Promise<DiagnosticQuestion[]> => {
  try {
    const prompt = `
      Generate a personalized diagnostic interview for a ${role} preparing for study abroad.
      ${getLangInstruction(lang)}

      Context:
      - Destination: ${context.destination}
      - Duration: ${context.duration}
      - Specific Details: ${context.details}

      Task:
      1. Create 5-8 questions based on provided context.
      2. All questions MUST be in ${lang === 'ko' ? 'Korean' : 'English'}.

      Return JSON array:
      [
        { "id": 1, "type": "scale", "question": "..." },
        { "id": 2, "type": "choice", "question": "...", "options": ["A", "B"] },
        { "id": 3, "type": "text", "question": "..." }
      ]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: jsonConfig
    });

    return JSON.parse(response.text || '[]');
  } catch (e) {
    return [
      { id: 1, type: 'scale', question: role === 'student' ? 'Confidence Check' : 'Trust Check' }
    ];
  }
};

export const generateDiagnosticReport = async (
  role: 'student' | 'parent',
  answers: DiagnosticAnswer[],
  lang: Language
): Promise<DiagnosticResult> => {
  try {
    const prompt = `
      Analyze these diagnostic answers for a study abroad ${role}.
      ${getLangInstruction(lang)}

      Answers: ${JSON.stringify(answers)}

      Task:
      1. Evaluate readiness.
      2. Provide feedback in ${lang === 'ko' ? 'Korean' : 'English'}. Use **bold** for emphasis.
      3. Give 3 actionable missions in ${lang === 'ko' ? 'Korean' : 'English'}.

      Return JSON:
      {
        "category": "${role}",
        "score": number (0-100),
        "feedback": "string with **bold** markup",
        "tips": ["string", "string", "string"]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: jsonConfig
    });

    return JSON.parse(response.text || '{}');
  } catch (e) {
    return {
      category: role,
      score: 0,
      feedback: "Analysis failed",
      tips: []
    };
  }
};

export const generateChecklist = async (destination: string, duration: string, lang: Language): Promise<ChecklistItem[]> => {
  try {
    const prompt = `
      Generate a checklist for a student going to ${destination} for ${duration}.
      ${getLangInstruction(lang)}
      The item text MUST be in ${lang === 'ko' ? 'Korean' : 'English'}.

      Return JSON array:
      { "id": string, "category": "string", "text": "string", "checked": false }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: jsonConfig
    });
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return [];
  }
};

export const generateSurvivalPhrases = async (scenario: string, lang: Language): Promise<Phrase[]> => {
  try {
    const prompt = `
      Generate 5 essential English survival phrases for: "${scenario}".
      The 'translation' field MUST be in ${lang === 'ko' ? 'Korean' : 'English'}.
      The 'note' field MUST be in ${lang === 'ko' ? 'Korean' : 'English'}.
      The 'text' field MUST be in English.

      Return JSON array:
      { "text": string (English), "translation": string, "note": string }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: jsonConfig
    });
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return [];
  }
};

export const estimateBudget = async (city: string, durationWeeks: number, lang: Language): Promise<BudgetData> => {
  try {
    const prompt = `
      Estimate study abroad costs for ${durationWeeks} weeks in ${city}.
      Return raw numbers in USD.
      Return JSON:
      { "programFee": number, "flight": number, "pocketMoney": number, "insurance": number, "shopping": number, "emergency": number }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: jsonConfig
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { programFee: 0, flight: 0, pocketMoney: 0, insurance: 0, shopping: 0, emergency: 0 };
  }
};

export const generateRandomScenario = async (lang: Language, region?: string): Promise<SimulationScenario> => {
  try {
    const regionContext = region ? `The scenario MUST take place in ${region} or involve a person from ${region}. Use local cultural context.` : 'The location is random.';

    const prompt = `
      Create a unique study abroad roleplay scenario.
      Context: ${regionContext}

      Rules:
      1. Title and Situation MUST be in ${lang === 'ko' ? 'Korean' : 'English'}.
      2. If specific people are mentioned in the 'Situation', use names appropriate for the region (e.g., "Sarah" for UK, not "Ji-min").
      3. Avoid generic office situations. Focus on: School life, Homestay, Travel mishaps, Making friends, Shopping, Emergencies.

      Return JSON:
      {
        "id": "string",
        "title": "string",
        "situation": "string",
        "difficulty": "Easy" | "Medium" | "Hard"
      }
    `;
     const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: jsonConfig
    });

    const data = JSON.parse(response.text || '{}');
    return {
      id: data.id || `rnd-${Date.now()}`,
      title: data.title,
      situation: data.situation,
      difficulty: data.difficulty || 'Medium'
    };
  } catch(e) {
    return {
      id: 'err',
      title: 'Error',
      situation: 'Try again',
      difficulty: 'Easy'
    };
  }
}

export const generateRoutine = async (destination: string, durationWeeks: number, level: string, lang: Language): Promise<RoutineItem[]> => {
  try {
    const prompt = `
      Create a ${durationWeeks}-week study abroad routine.
      ${getLangInstruction(lang)}

      All text fields (morning, school, evening, focus) MUST be in ${lang === 'ko' ? 'Korean' : 'English'}.
      Use **bold** for emphasis.

      Return JSON array:
      { "week": number, "day": number, "morning": string, "school": string, "evening": string, "focus": string }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: jsonConfig
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    return [];
  }
};

// --- NEW FEATURES ---

export const generateQuiz = async (
  region: string,
  difficulty: QuizDifficulty,
  type: QuizType,
  lang: Language
): Promise<QuizQuestion[]> => {
  try {
    // 1. Randomize Topic to prevent repetition
    const topics = [
      "Food & Restaurants",
      "Travel & Transportation",
      "School & Classroom",
      "Shopping & Money",
      "Health & Emergency",
      "Social Life & Making Friends",
      "Daily Routine & Housework",
      "Emotions & Personality"
    ];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    // 2. Strict Difficulty Definitions
    let difficultyGuide = "";
    switch (difficulty) {
      case 'Beginner':
        difficultyGuide = "CEFR A1-A2 level. Focus on single, concrete nouns/verbs and very simple survival sentences. DO NOT use slang.";
        break;
      case 'Intermediate':
        difficultyGuide = "CEFR B1-B2 level. Focus on standard conversational vocabulary, common phrasal verbs, and compound sentences. Moderate nuance.";
        break;
      case 'Advanced':
        difficultyGuide = "CEFR C1 level. Focus on sophisticated adjectives, abstract concepts, complex grammar, and professional terminology.";
        break;
      case 'Master':
        difficultyGuide = "CEFR C2 level. Focus on native slang, cultural idioms, subtle emotional nuances, and rare but useful vocabulary.";
        break;
    }

    // 3. Content Mix Instruction
    const contentMix = type === 'Vocabulary'
      ? "Provide a MIX: 50% single words (nouns/adjectives/verbs), 30% common phrasal verbs, 20% idioms/slang. Do NOT only provide idioms."
      : "Provide distinct, useful sentences.";

    const prompt = `
      Generate 5 language quiz questions.
      Target Region Usage: ${region} (e.g. if UK, use British English terms).
      Topic Context: ${randomTopic} (IMPORTANT: Stick to this topic).
      Difficulty Level: ${difficulty}.
      Difficulty Guide: ${difficultyGuide}
      Type: ${type}. ${contentMix}

      Task:
      Generate translation questions between English and Korean.
      The 'question' should be English.
      The 'correctAnswer' should be Korean.
      The 'explanation' MUST be in ${lang === 'ko' ? 'Korean' : 'English'}.

      Return JSON array:
      [
        {
          "id": 1,
          "question": "String (English)",
          "correctAnswer": "String (Korean)",
          "explanation": "String explanation of nuance or usage",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
        }
      ]
      NOTE: Provide 4 options for multiple choice. One is correct.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: jsonConfig
    });

    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const generateCharacter = async (region: string, lang: Language): Promise<Character> => {
  try {
    const prompt = `
      Generate a realistic persona for a person living in ${region || "a random English speaking country"}.

      STRICT GENERATION RULES:
      1. **NAME**: Must be a natural, local name for the specified region (e.g., "Oliver" for UK, "Jessica" for USA). Write the NAME in the local script (English for western countries). **DO NOT** translate or transliterate the name into Korean.
      2. **JOB**: Choose an occupation relevant to a study abroad student or daily life. Examples: **Teacher, Homestay Parent, Fellow Student, Librarian, Barista, Bus Driver, Nurse, Shopkeeper**.
         **DO NOT** use "Digital Marketer" or generic remote tech jobs.
      3. **LANGUAGE**: The fields 'job', 'personality', 'tone', 'bio' MUST be in ${lang === 'ko' ? 'Korean' : 'English'} so the user understands the character's role.

      Return JSON:
      {
        "name": "string (Native Name)",
        "age": number,
        "job": "string (in ${lang === 'ko' ? 'Korean' : 'English'})",
        "personality": "string (in ${lang === 'ko' ? 'Korean' : 'English'})",
        "tone": "string (in ${lang === 'ko' ? 'Korean' : 'English'})",
        "region": "${region || "Random"}",
        "bio": "string (in ${lang === 'ko' ? 'Korean' : 'English'})"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: jsonConfig
    });

    const data = JSON.parse(response.text || '{}');
    return {
      ...data,
      id: `char-${Date.now()}`,
      avatarId: Math.random().toString(36).substring(7) // Simple random seed
    };
  } catch (e) {
    return {
      id: `default-${Date.now()}`,
      name: 'Sarah',
      age: 24,
      job: 'University Student',
      personality: 'Friendly',
      tone: 'Casual',
      region: region || 'UK',
      avatarId: 'sarah',
      bio: 'A local student studying history.'
    };
  }
};

export const getChatResponse = async (
  history: SimulationTurn[],
  character: Character,
  scenarioSituation: string | undefined,
  userMessage: string,
  lang: Language
): Promise<string> => {
  try {
    const prompt = `
      Roleplay as ${character.name}.
      Profile: ${character.age} years old, ${character.job}, ${character.personality}, Tone: ${character.tone}, Region: ${character.region}.

      ${scenarioSituation ? `Current Scenario Context: ${scenarioSituation}` : 'Context: Casual conversation.'}

      History:
      ${history.map(h => `${h.speaker}: ${h.text}`).join('\n')}
      User: ${userMessage}

      Reply as ${character.name} in English.
      Keep it natural, use regional slang if appropriate for the region (${character.region}).
      Do NOT break character.
      Output ONLY the raw response text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || '...';
  } catch (e) {
    return "Sorry, I didn't catch that.";
  }
};

export const analyzeConversation = async (
  messages: SimulationTurn[],
  lang: Language
): Promise<string> => {
  try {
    const prompt = `
      Analyze the following English conversation practice.
      ${getLangInstruction(lang)}

      Messages to analyze:
      ${messages.map(m => `[${m.speaker}]: ${m.text}`).join('\n')}

      Task:
      Provide feedback in Markdown format.
      Include 3 sections:
      1. 👏 **Praise** (What was good?)
      2. 🔧 **Improvements** (Grammar, awkward phrasing)
      3. 🎯 **Actionable Tips** (Better vocabulary for this context)

      Output MUST be in ${lang === 'ko' ? 'Korean' : 'English'}.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || 'Analysis failed.';
  } catch (e) {
    return "Could not analyze conversation.";
  }
};
