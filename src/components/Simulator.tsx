'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Send, Bot, RefreshCw, Plus, Sparkles, Loader2, User, MessageSquare, Users, ArrowLeft, ArrowRight, CheckCircle, ScanEye, X, Globe, UserPlus, Edit3, Camera, MessageCircle, Film, Play, Mic, MicOff, Video, VideoOff, PhoneOff, Volume2, AlertTriangle, Settings2, PlayCircle, Captions, Download, FileText, MoreVertical, Wand2, Shuffle, Upload, ChevronRight } from 'lucide-react';
import { generateRandomScenario, generateCharacter, analyzeConversation, getChatResponse } from '@/services/geminiService';
import { SimulationTurn, SimulationScenario, Character } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import FormattedText from './FormattedText';

// --- AUDIO UTILS ---
const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;

function base64ToFloat32Array(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768.0;
  }
  return float32;
}

const Simulator: React.FC = () => {
  const { t, aiLanguage } = useLanguage();
  const apiKey = process.env.API_KEY || '';

  // --- UI STATE ---
  const [mode, setMode] = useState<'menu' | 'video_call' | 'text_chat' | 'report'>('menu');
  const [creationTab, setCreationTab] = useState<'auto' | 'manual'>('auto');
  const [reportTab, setReportTab] = useState<'analysis' | 'transcript'>('analysis');

  // Data State
  const [characters, setCharacters] = useState<Character[]>([]);
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([
     { id: '1', defaultRole: 'Host Mom', difficulty: 'Easy', title: t("Host Mom: Dinner", "호스트맘: 저녁 식사"), situation: "Your host mom knocks on your door regarding dinner plans. Discuss what to eat and any dietary restrictions." },
     { id: '2', defaultRole: 'Barista', difficulty: 'Medium', title: t("Cafe Order", "카페 주문하기"), situation: "You are ordering a complex coffee order at a busy cafe in London. The barista is friendly but fast-paced." },
  ]);

  // Selection State
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(null);
  const [activeScenario, setActiveScenario] = useState<SimulationScenario | null>(null);

  // Modal States
  const [showCharModal, setShowCharModal] = useState(false);
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false); // Mode (Video/Text) selector
  const [showCharSelector, setShowCharSelector] = useState(false); // Character picker for scenario

  const [tempSelectedChar, setTempSelectedChar] = useState<Character | null>(null);
  const [tempSelectedScenario, setTempSelectedScenario] = useState<SimulationScenario | null>(null);

  // Generation Inputs
  const [generationTopic, setGenerationTopic] = useState('');
  const [loading, setLoading] = useState(false);

  // Manual Character Creation Inputs
  const [manualChar, setManualChar] = useState<{
    name: string; age: string; job: string; region: string; personality: string; tone: string; bio: string; customAvatar: string | null;
  }>({
    name: '', age: '', job: '', region: '', personality: '', tone: '', bio: '', customAvatar: null
  });

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const idleTimeoutRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // --- LIVE SESSION STATE (VIDEO) ---
  const [connected, setConnected] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [safeMode, setSafeMode] = useState(true);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [liveUserText, setLiveUserText] = useState('');
  const [liveAiText, setLiveAiText] = useState('');

  // --- TEXT CHAT STATE ---
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [instantFeedback, setInstantFeedback] = useState<string | null>(null);

  // --- SHARED HISTORY ---
  const [transcript, setTranscript] = useState<SimulationTurn[]>([]);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const transcriptRef = useRef<SimulationTurn[]>([]);
  const currentInputRef = useRef<string>('');
  const currentOutputRef = useRef<string>('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // --- SETUP & INIT ---

  useEffect(() => {
    const savedChars = localStorage.getItem('readygo_characters');
    if (savedChars) {
        setCharacters(JSON.parse(savedChars));
    } else {
        const defaultChar: Character = {
            id: 'default-1', name: 'Sarah', age: 24, job: 'Student', region: 'London, UK',
            personality: 'Friendly & Talkative', tone: 'Casual', bio: 'Loves photography and coffee.', avatarId: 'sarah'
        };
        setCharacters([defaultChar]);
    }
    return () => cleanupSession();
  }, []);

  useEffect(() => {
    localStorage.setItem('readygo_characters', JSON.stringify(characters));
  }, [characters]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [transcript, isTyping]);

  const cleanupSession = () => {
    if (sessionRef.current) sessionRef.current = null;
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    setConnected(false);
    setAiSpeaking(false);
    setLiveUserText('');
    setLiveAiText('');
  };

  // --- ACTIONS ---

  const initiateModeSelection = (char: Character, scenario: SimulationScenario | null) => {
    setTempSelectedChar(char);
    setTempSelectedScenario(scenario);
    setShowSelectionModal(true);
  };

  const handleRandomChat = async () => {
    setLoading(true);
    try {
      // Generate a random interesting stranger
      const char = await generateCharacter("Random interesting stranger I met on the street", aiLanguage);
      initiateModeSelection(char, null);
    } catch (e) {
      alert("Failed to find a match. Try again.");
    }
    setLoading(false);
  };

  // Flow: Scenario Click -> Char Select -> Mode Select
  const handleScenarioSelect = (scenario: SimulationScenario) => {
    setTempSelectedScenario(scenario);
    setShowCharSelector(true); // Open character picker
  };

  const handleScenarioCharConfirm = (char: Character) => {
    setTempSelectedChar(char);
    setShowCharSelector(false);
    setShowSelectionModal(true); // Proceed to mode selection
  };

  const handleScenarioAutoChar = () => {
      if (!tempSelectedScenario) return;
      const role = tempSelectedScenario.defaultRole || "Partner";
      const placeholderChar: Character = {
        id: `npc-${tempSelectedScenario.id}`,
        name: role,
        age: 30,
        job: role,
        region: "Unknown",
        personality: "Professional",
        tone: "Polite",
        bio: `A roleplay partner for the scenario: ${tempSelectedScenario.title}`,
        avatarId: role.toLowerCase().replace(/\s/g, '')
      };
      handleScenarioCharConfirm(placeholderChar);
  }

  const handleStartSession = (type: 'video' | 'text') => {
    if (!tempSelectedChar) return;

    setActiveCharacter(tempSelectedChar);
    setActiveScenario(tempSelectedScenario);
    setTranscript([]);
    transcriptRef.current = [];
    currentInputRef.current = '';
    currentOutputRef.current = '';
    setAnalysis(null);
    setLiveUserText('');
    setLiveAiText('');
    setShowSelectionModal(false);
    setShowScenarioModal(false);

    if (type === 'video') {
      startVideoCall(tempSelectedChar, tempSelectedScenario);
    } else {
      setMode('text_chat');
      // Initial greeting logic
      setTimeout(() => {
         const initialGreeting: SimulationTurn = {
           id: 'init-ai',
           speaker: 'ai',
           text: tempSelectedScenario
             ? `Hello! I'm ${tempSelectedChar.name}. I'm ready for our scenario: "${tempSelectedScenario.title}".`
             : `Hi! I'm ${tempSelectedChar.name}. Nice to meet you!`,
           timestamp: Date.now()
         };
         setTranscript([initialGreeting]);
         transcriptRef.current = [initialGreeting];
      }, 500);
    }
  };

  // --- GENERATION HANDLERS ---

  const handleGenerateCharacter = async () => {
      if (!generationTopic) return;
      setLoading(true);
      const char = await generateCharacter(generationTopic, aiLanguage);
      setCharacters([char, ...characters]);
      setLoading(false);
      setShowCharModal(false);
      setGenerationTopic('');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setManualChar(prev => ({ ...prev, customAvatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualCharacterCreate = () => {
    if (!manualChar.name) return;
    const newChar: Character = {
      id: `man-${Date.now()}`,
      name: manualChar.name,
      age: parseInt(manualChar.age) || 20,
      job: manualChar.job,
      region: manualChar.region || 'Unknown',
      personality: manualChar.personality,
      tone: manualChar.tone || 'Neutral',
      bio: manualChar.bio || 'No bio provided.',
      avatarId: Math.random().toString(36).substring(7),
      customAvatar: manualChar.customAvatar || undefined
    };
    setCharacters([newChar, ...characters]);
    setShowCharModal(false);
    setManualChar({ name: '', age: '', job: '', region: '', personality: '', tone: '', bio: '', customAvatar: null });
  };

  const handleGenerateScenario = async () => {
      if (!generationTopic) return;
      setLoading(true);
      const scen = await generateRandomScenario(aiLanguage, generationTopic);
      setScenarios([scen, ...scenarios]);
      setLoading(false);
      setShowScenarioModal(false);
      setGenerationTopic('');
  };

  // --- TEXT CHAT LOGIC ---

  const handleSendText = async () => {
    if (!inputText.trim() || !activeCharacter) return;

    const userTurn: SimulationTurn = {
      id: `u-${Date.now()}`,
      speaker: 'user',
      text: inputText,
      timestamp: Date.now()
    };

    const newHistory = [...transcript, userTurn];
    setTranscript(newHistory);
    transcriptRef.current = newHistory;
    setInputText('');
    setIsTyping(true);

    const responseText = await getChatResponse(
      newHistory,
      activeCharacter,
      activeScenario?.situation,
      inputText,
      aiLanguage
    );

    const aiTurn: SimulationTurn = {
      id: `a-${Date.now()}`,
      speaker: 'ai',
      text: responseText,
      timestamp: Date.now()
    };

    const updatedHistory = [...newHistory, aiTurn];
    setTranscript(updatedHistory);
    transcriptRef.current = updatedHistory;
    setIsTyping(false);
  };

  const handleInstantFeedback = async () => {
    setShowFeedbackModal(true);
    setInstantFeedback(null);
    const result = await analyzeConversation(transcriptRef.current, aiLanguage);
    setInstantFeedback(result);
  };

  // --- VIDEO CALL LOGIC ---

  const startVideoCall = async (char: Character, scenario: SimulationScenario | null) => {
    setMode('video_call');
    audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        streamRef.current = stream;
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
        setCameraOn(true);
        await connectToGemini(char, scenario);
    } catch (err) {
        console.warn("Video access denied, falling back to audio.", err);
        try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = audioStream;
            if (videoRef.current) videoRef.current.srcObject = null;
            setCameraOn(false);
            await connectToGemini(char, scenario);
        } catch (audioErr) {
            alert("Microphone access is required.");
            setMode('menu');
        }
    }
  };

  const connectToGemini = async (char: Character, scenario: SimulationScenario | null) => {
    const ai = new GoogleGenAI({ apiKey });

    let instructions = `
      You are ${char.name}, a ${char.age}-year-old ${char.job} living in ${char.region}.
      Bio: ${char.bio}. Personality: ${char.personality}. Tone: ${char.tone}.
      Current Situation: ${scenario ? scenario.situation : "We are meeting for the first time. Start a natural conversation."}
    `;

    if (!safeMode) {
      instructions += `\n[SAFE MODE OFF] Be colloquial, slang-heavy, roast the user gently, act like a close friend.`;
    } else {
       instructions += `\n[SAFE MODE ON] Be friendly, polite, and helpful. Correct mistakes gently.`;
    }

    try {
        const session = await ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                systemInstruction: instructions,
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                },
            },
            callbacks: {
                onopen: () => {
                    setConnected(true);
                    setupAudioInput();
                },
                onmessage: (msg: LiveServerMessage) => handleServerMessage(msg),
                onclose: () => setConnected(false),
                onerror: (err) => console.error(err)
            }
        });
        sessionRef.current = session;
    } catch (e) {
        console.error(e);
        alert("Failed to connect to AI.");
        setMode('menu');
    }
  };

  const setupAudioInput = () => {
      if (!streamRef.current || !audioContextRef.current) return;
      const inputContext = new AudioContextClass({ sampleRate: 16000 });
      const source = inputContext.createMediaStreamSource(streamRef.current);
      const processor = inputContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
          if (!micOn) return;
          const inputData = e.inputBuffer.getChannelData(0);
          let sum = 0;
          for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
          const rms = Math.sqrt(sum / inputData.length);

          if (rms > 0.01) {
              setUserSpeaking(true);
              resetIdleTimer();
          } else {
              setUserSpeaking(false);
          }

          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
              pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
          }

          const bytes = new Uint8Array(pcmData.buffer);
          let binary = '';
          for(let i=0; i<bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
          const base64 = btoa(binary);

          sessionRef.current?.sendRealtimeInput({
              media: { mimeType: 'audio/pcm;rate=16000', data: base64 }
          });
      };
      source.connect(processor);
      processor.connect(inputContext.destination);
  };

  const handleServerMessage = async (msg: LiveServerMessage) => {
      const content = msg.serverContent;
      if (content?.inputTranscription?.text) {
         const inputText = content.inputTranscription.text;
         currentInputRef.current += inputText;
         setLiveUserText(prev => prev + inputText);
      }
      if (content?.outputTranscription?.text) {
         const outputText = content.outputTranscription.text;
         currentOutputRef.current += outputText;
         setLiveAiText(prev => prev + outputText);
      }
      if (content?.turnComplete) {
         commitUserTurn();
         commitAiTurn();
      }
      if (content?.interrupted) commitAiTurn();

      if (content?.modelTurn?.parts?.[0]?.inlineData?.data) {
          commitUserTurn();
          playAudioChunk(content.modelTurn.parts[0].inlineData.data);
      }
  };

  const commitUserTurn = () => {
      if (currentInputRef.current.trim()) {
          transcriptRef.current.push({ id: `u-${Date.now()}`, speaker: 'user', text: currentInputRef.current.trim(), timestamp: Date.now() });
          currentInputRef.current = '';
          setLiveUserText('');
      }
  };

  const commitAiTurn = () => {
      if (currentOutputRef.current.trim()) {
          transcriptRef.current.push({ id: `a-${Date.now()}`, speaker: 'ai', text: currentOutputRef.current.trim(), timestamp: Date.now() });
          currentOutputRef.current = '';
          setLiveAiText('');
      }
  };

  const playAudioChunk = async (base64: string) => {
      if (!audioContextRef.current) return;
      const float32 = base64ToFloat32Array(base64);
      const buffer = audioContextRef.current.createBuffer(1, float32.length, 24000);
      buffer.getChannelData(0).set(float32);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      const now = audioContextRef.current.currentTime;
      const startTime = Math.max(now, nextStartTimeRef.current);
      source.start(startTime);
      nextStartTimeRef.current = startTime + buffer.duration;
      setAiSpeaking(true);
      source.onended = () => {
          if (audioContextRef.current && audioContextRef.current.currentTime >= nextStartTimeRef.current - 0.1) {
             setAiSpeaking(false);
             resetIdleTimer();
          }
      };
  };

  const resetIdleTimer = () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = setTimeout(() => {}, 10000);
  };

  const endSession = async () => {
      commitUserTurn();
      commitAiTurn();
      cleanupSession();
      setTranscript([...transcriptRef.current]);
      setMode('report');

      setAnalyzing(true);
      if (transcriptRef.current.length > 0) {
          const feedback = await analyzeConversation(transcriptRef.current, aiLanguage);
          setAnalysis(feedback);
      } else {
          setAnalysis(t("No conversation detected.", "대화 내용이 없습니다."));
      }
      setAnalyzing(false);
  };

  const downloadTranscript = () => {
    const text = transcriptRef.current.map(t => `[${new Date(t.timestamp).toLocaleTimeString()}] ${t.speaker.toUpperCase()}: ${t.text}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation_log_${new Date().toISOString()}.txt`;
    a.click();
  };

  // --- RENDERERS ---

  const renderMenu = () => (
    <div className="max-w-6xl mx-auto space-y-10 pb-10">
       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
             <h2 className="text-3xl font-black text-slate-900 font-heading flex items-center gap-3">
               {t("AI Simulator", "AI 시뮬레이터")}
             </h2>
             <p className="text-slate-500 font-medium mt-1">{t("Practice scenarios via Text Chat or Video Call.", "텍스트 채팅 또는 화상 통화로 실전 상황을 연습하세요.")}</p>
          </div>

          <div className="bg-white p-2 pl-4 pr-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
             <div className="text-xs font-bold text-slate-600">
                 {safeMode ? t("Tutor Mode", "튜터 모드") : t("Buddy Mode", "친구 모드")}
             </div>
             <button onClick={() => setSafeMode(!safeMode)} className={`w-12 h-7 rounded-full p-1 transition-colors ${safeMode ? 'bg-slate-200' : 'bg-indigo-600'}`}>
               <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${safeMode ? 'translate-x-0' : 'translate-x-5'}`}></div>
             </button>
          </div>
       </div>

       {/* Random Match Card */}
       <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-indigo-200 relative overflow-hidden group cursor-pointer" onClick={handleRandomChat}>
          <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:opacity-20 transition-opacity"></div>
          <div className="relative z-10 flex items-center justify-between">
             <div className="space-y-4">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
                   <Globe className="text-white w-4 h-4" />
                   <span className="text-xs font-bold text-white uppercase tracking-wider">{t("Global Connect", "글로벌 랜덤 매칭")}</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-white font-heading leading-tight">
                   {t("Random Stranger Match", "랜덤 외국인 화상 채팅")}
                </h3>
                <p className="text-indigo-100 text-lg max-w-lg leading-relaxed">
                   {t("Connect with a random AI personality from around the world. Perfect for spontaneous conversation practice.", "전 세계의 랜덤 AI와 연결하여 예측 불가능한 실전 대화를 연습해보세요.")}
                </p>
                <div className="flex items-center gap-3 pt-2">
                   <button className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors flex items-center gap-2">
                      {loading ? <Loader2 className="animate-spin"/> : <Shuffle size={20} />}
                      {t("Find Match Now", "지금 매칭 시작")}
                   </button>
                </div>
             </div>
             <div className="hidden md:block relative">
                <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 animate-pulse">
                   <Video size={48} className="text-white" />
                </div>
             </div>
          </div>
       </div>

       {/* My Characters Section */}
       <div>
          <div className="flex items-center justify-between mb-6 px-2">
             <h3 className="text-xl font-black text-slate-800 font-heading flex items-center gap-2">
               <Users size={20} className="text-slate-400"/>
               {t("My Characters", "내 캐릭터")}
             </h3>
             <button onClick={() => setShowCharModal(true)} className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
               <Plus size={16} /> {t("Create New", "새 캐릭터 생성")}
             </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
             {characters.map(char => (
               <div key={char.id} className="group relative bg-white rounded-[2rem] border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer" onClick={() => initiateModeSelection(char, null)}>
                  <div className="aspect-square bg-slate-100 relative overflow-hidden">
                    <img src={char.customAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${char.avatarId}`} alt={char.name} className="w-full h-full object-cover"/>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <span className="text-white text-sm font-bold border border-white rounded-full px-3 py-1">{t("Select", "선택")}</span>
                    </div>
                  </div>
                  <div className="p-4">
                     <h4 className="font-black text-slate-800 truncate">{char.name}</h4>
                     <p className="text-xs text-slate-500 font-medium truncate">{char.job}, {char.region}</p>
                  </div>
               </div>
             ))}
             <button onClick={() => setShowCharModal(true)} className="border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all min-h-[200px]">
                <UserPlus size={24} />
                <span className="text-xs font-bold uppercase tracking-wider">{t("Add Character", "추가하기")}</span>
             </button>
          </div>
       </div>

       {/* Scenarios Section */}
       <div>
          <div className="flex items-center justify-between mb-6 px-2">
             <h3 className="text-xl font-black text-slate-800 font-heading flex items-center gap-2">
               <MessageSquare size={20} className="text-slate-400"/>
               {t("Practice Scenarios", "실전 연습 시나리오")}
             </h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
             {scenarios.map(s => (
               <button key={s.id} onClick={() => handleScenarioSelect(s)} className="bg-white p-6 rounded-[2rem] border border-slate-200 hover:border-indigo-500 hover:shadow-xl transition-all text-left group relative h-full">
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide mb-3 ${s.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-700' : s.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{s.difficulty}</span>
                  <h4 className="text-lg font-black text-slate-800 mb-2 font-heading group-hover:text-indigo-600 transition-colors">{s.title}</h4>
                  <p className="text-sm text-slate-500 font-medium line-clamp-3">{s.situation}</p>
                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                     <div className="bg-indigo-600 text-white p-2 rounded-full shadow-lg">
                        <ChevronRight size={16} strokeWidth={3}/>
                     </div>
                  </div>
               </button>
             ))}

             {/* New Scenario Button - Placed Inside Grid */}
             <button onClick={() => setShowScenarioModal(true)} className="border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-pink-400 hover:text-pink-600 hover:bg-pink-50 transition-all min-h-[200px] group h-full">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-transform shadow-sm">
                    <Plus size={24} />
                </div>
                <span className="text-sm font-bold uppercase tracking-wider">{t("Create Scenario", "시나리오 만들기")}</span>
             </button>
          </div>
       </div>
    </div>
  );

  const renderTextChat = () => (
    <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[85vh] max-w-5xl mx-auto md:mt-4 bg-[#fdfdfd] md:rounded-[2.5rem] md:border md:border-slate-200 md:shadow-2xl overflow-hidden">
       {/* Header (Relative Flex) */}
       <div className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-4">
             <button onClick={() => { endSession(); setMode('menu'); }} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><ArrowLeft size={22}/></button>
             <div className="flex items-center gap-3">
               <div className="relative">
                 <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-100 shadow-sm">
                   <img src={activeCharacter?.customAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeCharacter?.avatarId}`} className="w-full h-full object-cover"/>
                 </div>
                 <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
               </div>
               <div>
                 <h3 className="font-black text-slate-900 text-base leading-none mb-1">{activeCharacter?.name}</h3>
                 <p className="text-xs font-bold text-indigo-600">{activeScenario ? activeScenario.title : 'Free Chat'}</p>
               </div>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleInstantFeedback} className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-full flex items-center gap-1.5 transition-colors border border-indigo-100">
               <Wand2 size={14} /> <span className="hidden sm:inline">{t("Feedback", "피드백")}</span>
            </button>
            <button onClick={endSession} className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-full transition-colors shadow-md shadow-slate-200">
               {t("End Chat", "종료")}
            </button>
          </div>
       </div>

       {/* Chat Area (Scrollable) */}
       <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth bg-slate-50/50 relative custom-scrollbar">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>

          {transcript.map((t, idx) => {
             const isUser = t.speaker === 'user';
             return (
               <div key={t.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div className={`flex max-w-[85%] md:max-w-[70%] items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                     {!isUser && (
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-200 bg-white mb-1">
                           <img src={activeCharacter?.customAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeCharacter?.avatarId}`} className="w-full h-full object-cover"/>
                        </div>
                     )}
                     <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                        <div className={`px-5 py-3.5 text-[15px] shadow-sm leading-relaxed relative group transition-all hover:shadow-md
                           ${isUser
                              ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-2xl rounded-br-sm'
                              : 'bg-white text-slate-700 border border-slate-100 rounded-2xl rounded-bl-sm'
                           }`}>
                           {t.text}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 mt-1 px-1">
                           {new Date(t.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                     </div>
                  </div>
               </div>
             );
          })}

          {isTyping && (
            <div className="flex justify-start w-full animate-fade-in">
               <div className="flex items-end gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-200 bg-white mb-1">
                     <img src={activeCharacter?.customAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeCharacter?.avatarId}`} className="w-full h-full object-cover"/>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                     <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                     <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                     <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                  </div>
               </div>
            </div>
          )}
       </div>

       {/* Input Area (Fixed Bottom) */}
       <div className="p-4 bg-white border-t border-slate-100 z-20 shrink-0">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
             <div className="flex-1 relative">
                <input
                  autoFocus
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSendText()}
                  placeholder={t("Type your message...", "메시지를 입력하세요...")}
                  className="w-full bg-slate-100 border-2 border-transparent focus:bg-white focus:border-indigo-500 rounded-full pl-6 pr-12 py-3.5 outline-none text-slate-800 font-medium transition-all shadow-inner focus:shadow-lg focus:shadow-indigo-100 placeholder:text-slate-400"
                />
             </div>
             <button
                onClick={handleSendText}
                disabled={!inputText.trim()}
                className="p-3.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:scale-100"
             >
                <Send size={20} fill="currentColor" className="ml-0.5" />
             </button>
          </div>
       </div>

       {/* Feedback Modal */}
       {showFeedbackModal && (
         <div className="absolute inset-0 z-50 bg-slate-900/20 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl flex flex-col max-h-[80vh] animate-fade-in ring-1 ring-slate-900/5">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-[2rem]">
                  <h3 className="font-black text-lg text-slate-900 flex items-center gap-2"><Wand2 size={18} className="text-indigo-600"/> Instant Feedback</h3>
                  <button onClick={() => setShowFeedbackModal(false)} className="bg-white p-2 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"><X size={18}/></button>
               </div>
               <div className="p-6 overflow-y-auto custom-scrollbar">
                  {instantFeedback ? (
                     <div className="prose prose-sm prose-indigo max-w-none leading-relaxed text-slate-600"><FormattedText text={instantFeedback} /></div>
                  ) : (
                     <div className="flex flex-col items-center py-12 text-slate-500 gap-4">
                        <div className="relative">
                           <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                           <Loader2 className="animate-spin text-indigo-600 relative z-10" size={32} />
                        </div>
                        <span className="text-sm font-bold animate-pulse">{t("AI is analyzing your conversation...", "AI가 대화를 분석하고 있습니다...")}</span>
                     </div>
                  )}
               </div>
            </div>
         </div>
       )}
    </div>
  );

  const renderVideoCall = () => (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-30 blur-3xl pointer-events-none">
             <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full transition-all duration-500 ${aiSpeaking ? 'bg-indigo-500 scale-110' : 'bg-slate-700 scale-100'}`}></div>
          </div>
          <div className="relative z-10 flex flex-col items-center">
             <div className={`relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-full border-8 transition-all duration-200 ${aiSpeaking ? 'border-indigo-500 shadow-[0_0_100px_rgba(99,102,241,0.4)] scale-105' : 'border-slate-700 shadow-2xl scale-100'}`}>
                <img src={activeCharacter?.customAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeCharacter?.avatarId}`} className="w-full h-full object-cover rounded-full bg-slate-200"/>
                {aiSpeaking && <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2 w-16 h-8 bg-black/10 blur-md animate-pulse rounded-full"></div>}
                {!connected && <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm"><Loader2 className="w-12 h-12 text-white animate-spin" /></div>}
             </div>
             <div className="mt-8 text-center px-4">
                <h2 className="text-3xl font-black text-white font-heading tracking-tight">{activeCharacter?.name}</h2>
                <p className="text-indigo-200 font-medium text-lg flex items-center justify-center gap-2">
                    {activeCharacter?.region}
                    {!safeMode && <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-md font-bold border border-red-500/50">BUDDY MODE</span>}
                </p>
                {activeScenario && <p className="text-slate-400 text-sm mt-2 bg-slate-800/50 px-3 py-1 rounded-full inline-block">{activeScenario.title}</p>}
             </div>
          </div>

          {showCaptions && (liveUserText || liveAiText) && (
            <div className="absolute bottom-32 md:bottom-24 left-0 right-0 z-30 px-6 text-center">
               <div className="inline-block bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl max-w-2xl">
                  {liveAiText && <p className="text-indigo-300 font-medium text-lg">{liveAiText}</p>}
                  {liveUserText && <p className="text-white font-bold text-xl">{liveUserText}</p>}
               </div>
            </div>
          )}

          <div className={`absolute top-6 right-6 w-32 h-48 md:w-48 md:h-64 bg-black rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl transition-all ${userSpeaking ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : ''}`}>
              {cameraOn ? <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror-mode" /> : <div className="w-full h-full flex items-center justify-center bg-slate-800"><User size={32} className="text-slate-500" /></div>}
              <div className="absolute bottom-2 right-2 bg-black/50 p-1.5 rounded-lg backdrop-blur-md">
                 {micOn ? <Mic size={14} className="text-white"/> : <MicOff size={14} className="text-red-500"/>}
              </div>
          </div>

          <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-6 items-center z-20">
              <button onClick={() => setMicOn(!micOn)} className={`p-5 rounded-full transition-all ${micOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white text-red-600'}`}>{micOn ? <Mic size={24} /> : <MicOff size={24} />}</button>
              <button onClick={endSession} className="p-6 rounded-full bg-red-500 text-white hover:bg-red-600 shadow-xl hover:scale-105 transition-all"><PhoneOff size={32} fill="currentColor" /></button>
              <button onClick={() => setCameraOn(!cameraOn)} className={`p-5 rounded-full transition-all ${cameraOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white text-slate-900'}`} disabled={!streamRef.current || streamRef.current.getVideoTracks().length === 0}>{cameraOn ? <Video size={24} /> : <VideoOff size={24} />}</button>
              <button onClick={() => setShowCaptions(!showCaptions)} className={`absolute right-8 p-4 rounded-full transition-all hidden md:block ${showCaptions ? 'bg-slate-800 text-indigo-400' : 'bg-slate-800/50 text-slate-500'}`} title="Toggle Captions"><Captions size={20} /></button>
          </div>
      </div>
  );

  const renderReport = () => (
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pt-8">
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-slate-200">
              <div className="text-center mb-8">
                 <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600"><ScanEye size={40} /></div>
                 <h2 className="text-3xl font-black text-slate-900 font-heading mb-1">{t("Session Report", "세션 리포트")}</h2>
                 <p className="text-slate-500">{t("Conversation with", "대화 상대:")} <span className="font-bold text-indigo-600">{activeCharacter?.name}</span></p>
              </div>

              <div className="flex justify-center mb-6">
                 <div className="bg-slate-100 p-1 rounded-xl flex text-sm font-bold">
                    <button onClick={() => setReportTab('analysis')} className={`px-6 py-2 rounded-lg transition-all ${reportTab === 'analysis' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>{t("Analysis", "AI 분석")}</button>
                    <button onClick={() => setReportTab('transcript')} className={`px-6 py-2 rounded-lg transition-all ${reportTab === 'transcript' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>{t("Transcript", "전체 대화")}</button>
                 </div>
              </div>

              <div className="bg-slate-50 rounded-3xl border border-slate-100 min-h-[300px]">
                  {reportTab === 'analysis' ? (
                     <div className="p-8">
                         {analyzing ? (
                            <div className="text-center py-12">
                                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
                                <p className="font-bold text-slate-600">{t("Analyzing your conversation...", "대화 내용을 정밀 분석 중입니다...")}</p>
                            </div>
                        ) : (
                            <div className="prose prose-indigo prose-lg max-w-none"><FormattedText text={analysis || ""} /></div>
                        )}
                     </div>
                  ) : (
                     <div className="p-0 overflow-hidden flex flex-col h-[500px]">
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                           {transcript.map((turn) => (
                              <div key={turn.id} className="flex flex-col gap-1">
                                 <div className="flex items-center gap-2">
                                    <span className={`text-xs font-black uppercase tracking-wider ${turn.speaker === 'user' ? 'text-indigo-600' : 'text-slate-500'}`}>{turn.speaker === 'user' ? 'You' : activeCharacter?.name}</span>
                                    <span className="text-[10px] text-slate-400">{new Date(turn.timestamp).toLocaleTimeString()}</span>
                                 </div>
                                 <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed ${turn.speaker === 'user' ? 'bg-white border border-slate-200 text-slate-800' : 'bg-slate-200/50 text-slate-700'}`}>
                                    {turn.text}
                                 </div>
                              </div>
                           ))}
                        </div>
                        <div className="p-4 border-t border-slate-200 bg-white rounded-b-3xl flex justify-end">
                           <button onClick={downloadTranscript} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-colors">
                              <Download size={16} /> {t("Download Script", "스크립트 저장")}
                           </button>
                        </div>
                     </div>
                  )}
              </div>

              <div className="mt-8 text-center">
                  <button onClick={() => setMode('menu')} className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all">{t("Back to Menu", "메뉴로 돌아가기")}</button>
              </div>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen">
        {mode === 'menu' && renderMenu()}
        {mode === 'video_call' && renderVideoCall()}
        {mode === 'text_chat' && renderTextChat()}
        {mode === 'report' && renderReport()}

        {/* --- MODALS --- */}

        {/* 1. Scenario Character Picker Modal */}
        {showCharSelector && tempSelectedScenario && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
               <div className="bg-white w-full max-w-3xl rounded-[2rem] p-8 shadow-2xl animate-fade-in relative flex flex-col max-h-[85vh]">
                  <button onClick={() => setShowCharSelector(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-800 bg-slate-100 p-2 rounded-full transition-colors"><X size={20}/></button>

                  <div className="mb-6">
                    <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-wide mb-3 border border-indigo-100">Step 1</span>
                    <h3 className="text-2xl font-black text-slate-900 font-heading leading-tight">{t("Choose Your Partner", "대화 상대를 선택하세요")}</h3>
                    <p className="text-slate-500 mt-1">{t("Who do you want to practice this scenario with?", "누구와 함께 이 시나리오를 연습하시겠습니까?")}</p>
                  </div>

                  <div className="overflow-y-auto custom-scrollbar p-2 -m-2">
                      {/* Auto Match Option */}
                      <div
                        onClick={handleScenarioAutoChar}
                        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[1.5rem] p-6 mb-6 cursor-pointer hover:scale-[1.01] transition-transform shadow-lg relative overflow-hidden group"
                      >
                         <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20">
                                  <Sparkles size={24} />
                               </div>
                               <div>
                                  <h4 className="text-white font-black text-lg">{t("AI Recommended Role", "AI 추천 배역")}</h4>
                                  <p className="text-slate-400 text-sm">{t("Perfect for: ", "추천: ")} <span className="text-white">{tempSelectedScenario.defaultRole || "Context Match"}</span></p>
                               </div>
                            </div>
                            <ArrowRight className="text-white opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-2" />
                         </div>
                      </div>

                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{t("Or Choose Your Character", "또는 내 캐릭터 중 선택")}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {characters.map(char => (
                              <div
                                key={char.id}
                                onClick={() => handleScenarioCharConfirm(char)}
                                className="bg-white border border-slate-200 p-4 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50/30 hover:shadow-lg transition-all cursor-pointer flex items-center gap-3 group"
                              >
                                 <img src={char.customAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${char.avatarId}`} className="w-12 h-12 rounded-full bg-slate-100 object-cover border border-slate-100 group-hover:border-indigo-200"/>
                                 <div className="overflow-hidden">
                                    <h5 className="font-bold text-slate-900 truncate group-hover:text-indigo-700">{char.name}</h5>
                                    <p className="text-xs text-slate-500 truncate">{char.job}</p>
                                 </div>
                              </div>
                          ))}
                          <button onClick={() => { setShowCharSelector(false); setShowCharModal(true); }} className="border-2 border-dashed border-slate-200 rounded-2xl p-4 flex items-center justify-center gap-2 text-slate-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                              <Plus size={18} />
                              <span className="text-sm font-bold">{t("Create New", "새로 만들기")}</span>
                          </button>
                      </div>
                  </div>
               </div>
            </div>
        )}

        {/* 2. Mode Selection Modal */}
        {showSelectionModal && tempSelectedChar && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl animate-fade-in relative text-center">
                  <button onClick={() => setShowSelectionModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-800 bg-slate-100 p-2 rounded-full transition-colors"><X size={20}/></button>

                  <div className="mb-6">
                     <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-wide border border-indigo-100">Step 2</span>
                  </div>

                  <div className="w-24 h-24 mx-auto rounded-full border-4 border-slate-100 overflow-hidden mb-4 shadow-xl relative">
                     <img src={tempSelectedChar.customAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tempSelectedChar.avatarId}`} className="w-full h-full object-cover"/>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 font-heading">{tempSelectedChar.name}</h3>
                  <p className="text-slate-500 text-sm mb-8 font-medium">{t("Choose communication method", "대화 방식을 선택하세요")}</p>

                  <div className="space-y-3">
                     <button onClick={() => handleStartSession('video')} className="w-full p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center gap-4 group text-left shadow-sm hover:shadow-md">
                        <div className="bg-indigo-100 text-indigo-600 p-3 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm"><Video size={24}/></div>
                        <div>
                           <div className="font-bold text-slate-800 group-hover:text-indigo-700 text-lg">{t("Video Call", "화상 통화")}</div>
                           <div className="text-xs text-slate-500 font-medium">{t("Real-time voice & face", "실시간 음성 및 화상")}</div>
                        </div>
                     </button>
                     <button onClick={() => handleStartSession('text')} className="w-full p-4 rounded-2xl border-2 border-slate-100 hover:border-pink-500 hover:bg-pink-50 transition-all flex items-center gap-4 group text-left shadow-sm hover:shadow-md">
                        <div className="bg-pink-100 text-pink-600 p-3 rounded-xl group-hover:bg-pink-600 group-hover:text-white transition-colors shadow-sm"><MessageSquare size={24}/></div>
                        <div>
                           <div className="font-bold text-slate-800 group-hover:text-pink-700 text-lg">{t("Text Chat", "텍스트 채팅")}</div>
                           <div className="text-xs text-slate-500 font-medium">{t("Typing & instant feedback", "채팅 및 즉시 피드백")}</div>
                        </div>
                     </button>
                  </div>
              </div>
           </div>
        )}

        {/* Character Creation Modal */}
        {showCharModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative animate-fade-in max-h-[90vh] overflow-y-auto custom-scrollbar">
               <button onClick={() => setShowCharModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-800"><X size={20}/></button>

               <div className="mb-6">
                  <h3 className="text-2xl font-black text-slate-900 font-heading">{t("Create Persona", "새 페르소나 생성")}</h3>
                  <div className="flex gap-2 mt-4 p-1 bg-slate-100 rounded-xl">
                     <button onClick={() => setCreationTab('auto')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${creationTab === 'auto' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>AI Auto</button>
                     <button onClick={() => setCreationTab('manual')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${creationTab === 'manual' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>Manual</button>
                  </div>
               </div>

               {creationTab === 'auto' ? (
                 <div className="space-y-4">
                   <p className="text-slate-500 text-sm">{t("Describe who you want to meet.", "만나고 싶은 사람을 묘사해주세요.")}</p>
                   <input
                     autoFocus
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 focus:border-indigo-500 outline-none"
                     placeholder={t("e.g. A strict math teacher in London", "예: 런던의 엄격한 수학 선생님")}
                     value={generationTopic}
                     onChange={e => setGenerationTopic(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && handleGenerateCharacter()}
                   />
                   <button onClick={handleGenerateCharacter} disabled={loading || !generationTopic} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex justify-center gap-2">
                     {loading ? <Loader2 className="animate-spin"/> : <Sparkles size={18}/>} {t("Generate", "생성하기")}
                   </button>
                 </div>
               ) : (
                 <div className="space-y-3">
                    {/* Avatar Upload */}
                    <div className="flex justify-center mb-4">
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all overflow-hidden group"
                      >
                        {manualChar.customAvatar ? (
                          <img src={manualChar.customAvatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center text-slate-400 group-hover:text-indigo-500">
                             <Upload size={20} />
                             <span className="text-[10px] font-bold mt-1">Photo</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <input placeholder={t("Name", "이름")} value={manualChar.name} onChange={e => setManualChar({...manualChar, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500"/>
                    <div className="flex gap-3">
                      <input placeholder={t("Age", "나이")} type="number" value={manualChar.age} onChange={e => setManualChar({...manualChar, age: e.target.value})} className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500"/>
                      <input placeholder={t("Job", "직업")} value={manualChar.job} onChange={e => setManualChar({...manualChar, job: e.target.value})} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500"/>
                    </div>
                    <input placeholder={t("Region (e.g. UK)", "지역")} value={manualChar.region} onChange={e => setManualChar({...manualChar, region: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500"/>
                    <input placeholder={t("Personality", "성격")} value={manualChar.personality} onChange={e => setManualChar({...manualChar, personality: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500"/>
                    <textarea placeholder={t("Bio / Details", "상세 설명")} value={manualChar.bio} onChange={e => setManualChar({...manualChar, bio: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500 h-24 resize-none"/>
                    <button onClick={handleManualCharacterCreate} disabled={!manualChar.name} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50">
                      {t("Create Character", "캐릭터 생성")}
                    </button>
                 </div>
               )}
            </div>
         </div>
       )}

       {/* Scenario Generator Modal */}
       {showScenarioModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative animate-fade-in">
               <button onClick={() => setShowScenarioModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-800"><X size={20}/></button>
               <div className="mb-6">
                  <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600 mb-4"><Edit3 size={24}/></div>
                  <h3 className="text-2xl font-black text-slate-900 font-heading">{t("Create Scenario", "새 시나리오 생성")}</h3>
                  <p className="text-slate-500 text-sm mt-1">{t("Describe the situation to practice.", "연습하고 싶은 상황을 묘사해주세요.")}</p>
               </div>
               <input autoFocus className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-4 font-bold text-slate-800 focus:border-pink-500 outline-none" placeholder={t("e.g. Losing a passport at the airport", "예: 공항에서 여권을 잃어버림")} value={generationTopic} onChange={e => setGenerationTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleGenerateScenario()}/>
               <button onClick={handleGenerateScenario} disabled={loading || !generationTopic} className="w-full bg-pink-600 text-white py-4 rounded-xl font-bold hover:bg-pink-700 transition-all disabled:opacity-50 flex justify-center gap-2">
                 {loading ? <Loader2 className="animate-spin"/> : <Sparkles size={18}/>} {t("Generate Scenario", "시나리오 생성하기")}
               </button>
            </div>
         </div>
       )}
    </div>
  );
};

export default Simulator;
