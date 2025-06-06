import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Search, Loader, MessageSquare, Mic, MicOff, X, Globe } from 'lucide-react';

type SpeechRecognition = any;
type SpeechRecognitionEvent = any;
type SpeechRecognitionError = any;

interface NLQueryInputProps {
  onQuery: (query: string) => Promise<void>;
  isLoading: boolean;
  placeholder?: string;
  className?: string;
  enableVoice?: boolean;
  onClear?: () => void;
  defaultLanguage?: string;
  recognitionTimeout?: number;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
  { code: 'it-IT', name: 'Italian' },
  { code: 'pt-BR', name: 'Portuguese' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'ko-KR', name: 'Korean' },
  { code: 'zh-CN', name: 'Chinese' },
];

export function NLQueryInput({
  onQuery,
  isLoading,
  placeholder = "Ask a question about your data...",
  className = "",
  enableVoice = false,
  onClear,
  defaultLanguage = 'en-US',
  recognitionTimeout = 10000, // 10 seconds default timeout
}: NLQueryInputProps) {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    await onQuery(query.trim());
    setQuery('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  const handleClear = () => {
    setQuery('');
    onClear?.();
    inputRef.current?.focus();
  };

  const toggleVoiceRecognition = () => {
    if (!enableVoice) return;

    if (isListening) {
      stopVoiceRecognition();
    } else {
      startVoiceRecognition();
    }
  };

  const startVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setRecognitionError("Your browser doesn't support speech recognition. Try Chrome or Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = selectedLanguage;

      recognition.onstart = () => {
        setIsListening(true);
        setRecognitionError(null);
        // Set timeout to automatically stop recognition
        timeoutRef.current = setTimeout(() => {
          stopVoiceRecognition();
          setRecognitionError('Voice recognition timed out. Please try again.');
        }, recognitionTimeout);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        // Clear timeout on successful recognition
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };

      recognition.onerror = (event: SpeechRecognitionError) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        let errorMessage = 'An error occurred with voice recognition.';
        if (event.error === 'no-speech') {
          errorMessage = 'No speech was detected. Please try again.';
        } else if (event.error === 'audio-capture') {
          errorMessage = 'No microphone was found. Please ensure your microphone is connected and try again.';
        } else if (event.error === 'not-allowed') {
          errorMessage = 'Permission to use microphone was denied. Please allow microphone access and try again.';
        }
        setRecognitionError(errorMessage);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      setRecognitionError('Failed to initialize speech recognition. Please try again.');
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsListening(false);
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <MessageSquare className="absolute left-4 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className="w-full pl-12 pr-16 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="Natural language query input"
        />
        
        {query && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-12 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear query"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        {enableVoice && (
          <div className="absolute right-12 flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="p-2 text-gray-400 hover:text-teal-600 transition-colors"
              aria-label="Select language"
            >
              <Globe className="w-5 h-5" />
            </button>
            
            <button
              type="button"
              onClick={toggleVoiceRecognition}
              disabled={isLoading}
              className={`p-2 transition-colors ${query ? 'mr-8' : ''} ${
                isListening 
                  ? 'text-red-500 animate-pulse' 
                  : 'text-gray-400 hover:text-teal-600'
              }`}
              aria-label={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
        )}
        
        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className={`absolute right-2 p-2 transition-colors ${
            !query.trim() || isLoading 
              ? 'text-gray-300' 
              : 'text-teal-600 hover:text-teal-700'
          }`}
          aria-label="Submit query"
        >
          {isLoading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </button>
      </div>
      
      {showLanguageMenu && enableVoice && (
        <div className="absolute right-12 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="py-2 max-h-60 overflow-y-auto">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setSelectedLanguage(lang.code);
                  setShowLanguageMenu(false);
                }}
                className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${
                  selectedLanguage === lang.code ? 'bg-teal-50 text-teal-600' : ''
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-500 flex justify-between px-1">
        <span>Press Enter to submit</span>
        {enableVoice && (
          <div className="flex items-center space-x-4">
            {isListening && (
              <span className="text-red-500 animate-pulse">Listening...</span>
            )}
            {recognitionError && (
              <span className="text-red-500">{recognitionError}</span>
            )}
            {!isListening && !recognitionError && (
              <span>Press mic to speak</span>
            )}
          </div>
        )}
      </div>
    </form>
  );
} 