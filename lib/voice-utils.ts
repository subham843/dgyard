/**
 * Voice-friendly text utilities for Honey AI
 * Converts text to natural, humanized speech format
 */

// Remove emojis and symbols
export function removeEmojisAndSymbols(text: string): string {
  // Remove emojis (Unicode ranges)
  let cleaned = text.replace(/[\u{1F600}-\u{1F64F}]/gu, ''); // Emoticons
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F5FF}]/gu, ''); // Misc Symbols
  cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, ''); // Transport
  cleaned = cleaned.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, ''); // Flags
  cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, ''); // Misc symbols
  cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, ''); // Dingbats
  cleaned = cleaned.replace(/[\u{1F900}-\u{1F9FF}]/gu, ''); // Supplemental Symbols
  cleaned = cleaned.replace(/[\u{1FA00}-\u{1FA6F}]/gu, ''); // Chess Symbols
  cleaned = cleaned.replace(/[\u{1FA70}-\u{1FAFF}]/gu, ''); // Symbols and Pictographs
  
  // Remove common symbols that shouldn't be read
  cleaned = cleaned.replace(/[🔷🔑✅❌⚠️📋🔄🤖🧠💡📝📊📈📉🎯🚀💼🛠️📹]/g, '');
  cleaned = cleaned.replace(/[⭐🌟✨💫🔥💯🎉🎊👏🙌👍👎]/g, '');
  cleaned = cleaned.replace(/[📱💻🖥️⌨️🖱️]/g, '');
  cleaned = cleaned.replace(/[💰💵💸💳]/g, '');
  cleaned = cleaned.replace(/[📍🗺️🌍🌎🌏]/g, '');
  cleaned = cleaned.replace(/[📞📧✉️💬💭]/g, '');
  cleaned = cleaned.replace(/[⏰⏱️⏲️⏳]/g, '');
  cleaned = cleaned.replace(/[🔒🔓🔐]/g, '');
  cleaned = cleaned.replace(/[📦📨📩📬📭]/g, '');
  cleaned = cleaned.replace(/[🎁🎀🎂🎄🎃]/g, '');
  
  // Remove markdown formatting symbols
  cleaned = cleaned.replace(/\*\*/g, ''); // Bold
  cleaned = cleaned.replace(/\*/g, ''); // Italic
  cleaned = cleaned.replace(/__/g, ''); // Bold
  cleaned = cleaned.replace(/_/g, ''); // Italic
  cleaned = cleaned.replace(/~~/g, ''); // Strikethrough
  cleaned = cleaned.replace(/`/g, ''); // Code
  cleaned = cleaned.replace(/#{1,6}\s/g, ''); // Headers
  
  // Remove URLs but keep the text readable
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, 'website');
  cleaned = cleaned.replace(/www\.[^\s]+/g, 'website');
  
  // Remove email addresses but keep readable
  cleaned = cleaned.replace(/[^\s]+@[^\s]+/g, 'email address');
  
  // Remove special characters that shouldn't be read
  cleaned = cleaned.replace(/[•▪▫]/g, '');
  cleaned = cleaned.replace(/[→←↑↓]/g, '');
  cleaned = cleaned.replace(/[©®™]/g, '');
  
  return cleaned.trim();
}

// Convert text to natural speech format
export function textToSpeechFormat(text: string, language: "en-IN" | "hi-IN" = "en-IN"): string {
  let speech = removeEmojisAndSymbols(text);
  
  // Fix "Honey" pronunciation - ensure it sounds natural
  speech = speech.replace(/\bHoney\b/gi, 'Honey'); // Keep natural pronunciation
  // Add slight pause for natural flow when "Honey" appears
  speech = speech.replace(/\bI'm Honey\b/gi, "I'm Honey");
  speech = speech.replace(/\bHoney here\b/gi, "Honey here");
  speech = speech.replace(/\bHoney,\b/gi, "Honey,");
  
  // Replace abbreviations with full words
  const abbreviations: { [key: string]: string } = {
    'CCTV': 'C C T V',
    'DVR': 'D V R',
    'NVR': 'N V R',
    'PTZ': 'P T Z',
    'HDD': 'H D D',
    'GB': 'gigabytes',
    'TB': 'terabytes',
    'MP': 'megapixel',
    '4MP': '4 megapixel',
    '2MP': '2 megapixel',
    '1080p': '1080 p',
    '4K': '4 K',
    'WiFi': 'Wi Fi',
    'IP': 'I P',
    'API': 'A P I',
    'AI': 'A I',
    'USD': 'U S dollars',
    'INR': 'Indian rupees',
    '₹': 'rupees',
    // Removed '$': 'dollars' - don't say dollars for Indian context
    'etc.': 'etcetera',
    'e.g.': 'for example',
    'i.e.': 'that is',
    'vs.': 'versus',
    'Mr.': 'Mister',
    'Mrs.': 'Missus',
    'Dr.': 'Doctor',
    'Prof.': 'Professor',
  };
  
  // Replace abbreviations
  for (const [abbr, full] of Object.entries(abbreviations)) {
    const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
    speech = speech.replace(regex, full);
  }
  
  // Handle numbers naturally
  speech = speech.replace(/\b(\d+)\s*(thousand|k)\b/gi, (match, num, unit) => {
    const n = parseInt(num);
    if (n === 1) return 'one thousand';
    return `${num} thousand`;
  });
  
  speech = speech.replace(/\b₹\s*(\d+)/g, 'rupees $1');
  // Removed dollar replacement - don't say dollars, just remove the $ symbol
  speech = speech.replace(/\$(\d+)/g, '$1'); // Remove $ but don't say "dollars"
  speech = speech.replace(/\$\s*/g, ''); // Remove standalone $ symbols
  
  // Handle bullet points
  speech = speech.replace(/^[-•]\s*/gm, '');
  speech = speech.replace(/\n[-•]\s*/g, '\n');
  
  // Handle numbered lists
  speech = speech.replace(/^\d+\.\s*/gm, '');
  speech = speech.replace(/\n\d+\.\s*/g, '\n');
  
  // Clean up multiple spaces
  speech = speech.replace(/\s+/g, ' ');
  
  // Clean up multiple newlines
  speech = speech.replace(/\n{3,}/g, '\n\n');
  
  // Add natural pauses for humanized speech
  speech = speech.replace(/\.\s+/g, '. '); // Natural pause after period
  speech = speech.replace(/,\s+/g, ', '); // Natural pause after comma
  speech = speech.replace(/;\s+/g, '; '); // Natural pause after semicolon
  speech = speech.replace(/:\s+/g, ': '); // Natural pause after colon
  
  // Handle question marks and exclamations with natural pauses
  speech = speech.replace(/\?\s+/g, '? '); // Natural pause after question
  speech = speech.replace(/!\s+/g, '! '); // Natural pause after exclamation
  
  // Add natural pauses for better flow (Google Assistant style)
  speech = speech.replace(/\b(Honey|Namaste|Hello|Hi)\b/gi, (match) => {
    return match; // Keep as is but ensure proper pronunciation
  });
  
  // Ensure "Honey" is pronounced clearly
  speech = speech.replace(/\bHoney\b/gi, 'Honey'); // Natural pronunciation
  
  // For Hindi/Hinglish, add natural pauses
  if (language === "hi-IN") {
    // Add pauses after common Hindi words
    speech = speech.replace(/\b(main|aap|hum|wo|ye|ka|ki|ke|ko|se|par|aur|ya|bhi|nahi|na|hai|hain|ho|hoga|hogi)\b/gi, (match) => {
      return match + ' ';
    });
  }
  
  return speech.trim();
}

// Convert response to voice-friendly format
export function formatResponseForVoice(
  response: string,
  language: "en-IN" | "hi-IN" = "en-IN"
): string {
  // First, convert to speech format
  let voiceText = textToSpeechFormat(response, language);
  
  // Remove markdown links but keep text
  voiceText = voiceText.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  // Remove HTML tags if any
  voiceText = voiceText.replace(/<[^>]+>/g, '');
  
  // Handle common patterns for natural speech
  voiceText = voiceText.replace(/\b(\d+)\s*x\s*(\d+)\b/gi, '$1 by $2');
  voiceText = voiceText.replace(/\b(\d+)\s*%\b/g, '$1 percent');
  
  // Handle common technical terms
  voiceText = voiceText.replace(/\bHD\b/gi, 'H D');
  voiceText = voiceText.replace(/\bFHD\b/gi, 'F H D');
  voiceText = voiceText.replace(/\bUHD\b/gi, 'U H D');
  
  // Clean up
  voiceText = voiceText.replace(/\s+/g, ' ');
  voiceText = voiceText.trim();
  
  return voiceText;
}

// Get voice-friendly response (main function to use)
export function getVoiceFriendlyResponse(
  response: string,
  language: "en-IN" | "hi-IN" = "en-IN"
): { text: string; voiceText: string } {
  return {
    text: response, // Original text for display
    voiceText: formatResponseForVoice(response, language), // Clean text for voice
  };
}

