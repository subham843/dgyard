"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Play, Square, Volume2, Mic, Upload, X, Info } from "lucide-react";
import toast from "react-hot-toast";

interface VoiceSettingsProps {
  voiceSettings: {
    aiVoiceName?: string;
    aiVoiceLang?: string;
    aiVoiceRate?: number;
    aiVoicePitch?: number;
    aiVoiceVolume?: number;
    aiVoiceURI?: string;
    aiCustomVoiceUrl?: string;
    aiVoiceScript?: string;
  };
  onSave: (settings: any) => void;
}

export function VoiceSettings({ voiceSettings, onSave }: VoiceSettingsProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [testText, setTestText] = useState("Namaste! Mai Honey hoon. Mai aapki help kar sakti hoon products, services, aur quotations ke baare mein.");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  // Helper function to replace "Main" with "Mai" in script
  const fixScriptText = (script: string | undefined): string => {
    if (!script) return `Namaste! Mai Honey hoon. Mai D.G.Yard ki AI assistant hoon. Mai aapki help kar sakti hoon products, services, quotations, aur bhi bahut kuch ke baare mein. Mai English aur Hindi dono languages mein baat kar sakti hoon. Aap mujhse kuch bhi puchh sakte hain.`;
    // Replace "Main" with "Mai" for natural Hindi
    return script
      .replace(/\bMain Honey\b/g, 'Mai Honey')
      .replace(/\bMain aapki\b/g, 'Mai aapki')
      .replace(/\bMain D\.G\.Yard\b/g, 'Mai D.G.Yard')
      .replace(/\bMain English\b/g, 'Mai English')
      .replace(/\bMain samajh\b/g, 'Mai samajh')
      .replace(/\bMain yahan\b/g, 'Mai yahan')
      .replace(/\bMain products\b/g, 'Mai products')
      .replace(/\bMain services\b/g, 'Mai services')
      .replace(/\bMain kar sakti\b/g, 'Mai kar sakti');
  };

  const [settings, setSettings] = useState({
    aiVoiceName: voiceSettings.aiVoiceName || "",
    aiVoiceLang: voiceSettings.aiVoiceLang || "en-IN",
    aiVoiceRate: voiceSettings.aiVoiceRate ?? 1.0,
    aiVoicePitch: voiceSettings.aiVoicePitch ?? 1.0,
    aiVoiceVolume: voiceSettings.aiVoiceVolume ?? 1.0,
    aiVoiceURI: voiceSettings.aiVoiceURI || "",
    aiCustomVoiceUrl: voiceSettings.aiCustomVoiceUrl || "",
    aiVoiceScript: fixScriptText(voiceSettings.aiVoiceScript),
  });

  // Sync local state when voiceSettings prop changes
  useEffect(() => {
    const fixedScript = fixScriptText(voiceSettings.aiVoiceScript);
    setSettings({
      aiVoiceName: voiceSettings.aiVoiceName || "",
      aiVoiceLang: voiceSettings.aiVoiceLang || "en-IN",
      aiVoiceRate: voiceSettings.aiVoiceRate ?? 1.0,
      aiVoicePitch: voiceSettings.aiVoicePitch ?? 1.0,
      aiVoiceVolume: voiceSettings.aiVoiceVolume ?? 1.0,
      aiVoiceURI: voiceSettings.aiVoiceURI || "",
      aiCustomVoiceUrl: voiceSettings.aiCustomVoiceUrl || "",
      aiVoiceScript: fixedScript,
    });
  }, [voiceSettings]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Select saved voice if available
      if (settings.aiVoiceName) {
        const savedVoice = availableVoices.find(
          (v) => v.name === settings.aiVoiceName || v.voiceURI === settings.aiVoiceURI
        );
        if (savedVoice) {
          setSelectedVoice(savedVoice);
        }
      } else {
        // Auto-select Indian female voice if available
        const indianVoice = availableVoices.find(
          (v) =>
            (v.lang.includes("IN") || v.lang.includes("en-IN") || v.lang.includes("hi-IN")) &&
            (!v.name.toLowerCase().includes("male")) &&
            (!v.name.toLowerCase().includes("heera"))
        );
        if (indianVoice) {
          setSelectedVoice(indianVoice);
          setSettings(prev => ({
            ...prev,
            aiVoiceName: indianVoice.name,
            aiVoiceURI: indianVoice.voiceURI,
            aiVoiceLang: indianVoice.lang,
          }));
        }
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, [settings.aiVoiceName, settings.aiVoiceURI]);

  const speak = () => {
    if (!testText.trim()) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(testText);
    utterance.rate = settings.aiVoiceRate;
    utterance.pitch = settings.aiVoicePitch;
    utterance.volume = settings.aiVoiceVolume;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = settings.aiVoiceLang;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedAudio(url);
        setAudioChunks(chunks);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.success("Recording started. Please read the script.");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording. Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setIsRecording(false);
      toast.success("Recording stopped. Please upload the audio.");
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      toast.error("Please upload an audio file");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "voice");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setSettings((prev) => ({
          ...prev,
          aiCustomVoiceUrl: data.url,
        }));
        toast.success("Voice file uploaded successfully!");
      } else {
        toast.error(data.error || "Failed to upload voice file");
      }
    } catch (error) {
      toast.error("Failed to upload voice file");
    } finally {
      e.target.value = "";
    }
  };

  const handleSave = () => {
    // Auto-fix script text before saving (replace "Main" with "Mai")
    const fixedScript = fixScriptText(settings.aiVoiceScript);
    const voiceData = {
      ...settings,
      aiVoiceName: selectedVoice?.name || settings.aiVoiceName,
      aiVoiceURI: selectedVoice?.voiceURI || settings.aiVoiceURI,
      aiVoiceLang: selectedVoice?.lang || settings.aiVoiceLang,
      aiVoiceScript: fixedScript, // Use fixed script
    };
    // Update local state with fixed script
    setSettings(prev => ({ ...prev, aiVoiceScript: fixedScript }));
    onSave(voiceData);
    toast.success("Voice settings updated in form! Click 'Save Settings' button at bottom to save to database.");
  };

  const filteredVoices = voices.filter(
    (v) =>
      (v.lang.includes("IN") || v.lang.includes("en") || v.lang.includes("hi")) &&
      (!v.name.toLowerCase().includes("heera"))
  );

  return (
    <div className="space-y-6">
      {/* Voice Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Voice Selection
        </h3>
        
        <div className="space-y-4">
          <div>
            <Label>Available Voices ({filteredVoices.length} found)</Label>
            <div className="mt-2 space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
              {filteredVoices.map((voice, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedVoice?.name === voice.name
                      ? "bg-blue-50 border-blue-500"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setSelectedVoice(voice);
                    const updatedSettings = {
                      ...settings,
                      aiVoiceName: voice.name,
                      aiVoiceURI: voice.voiceURI,
                      aiVoiceLang: voice.lang,
                    };
                    setSettings(updatedSettings);
                    // Auto-save when voice is selected
                    onSave({
                      ...updatedSettings,
                      aiVoiceName: voice.name,
                      aiVoiceURI: voice.voiceURI,
                      aiVoiceLang: voice.lang,
                    });
                  }}
                >
                  <div className="font-semibold">{voice.name}</div>
                  <div className="text-sm text-gray-600">
                    {voice.lang} {voice.default && "(Default)"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedVoice && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="font-semibold text-green-800">Selected: {selectedVoice.name}</div>
              <div className="text-sm text-green-600">{selectedVoice.lang}</div>
            </div>
          )}
        </div>
      </Card>

      {/* Voice Parameters */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Voice Parameters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>
              Speed (Rate): {settings.aiVoiceRate.toFixed(2)}
            </Label>
            <Input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.aiVoiceRate}
              onChange={(e) => setSettings(prev => ({ ...prev, aiVoiceRate: parseFloat(e.target.value) }))}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">0.5 (slow) - 2.0 (fast)</p>
          </div>
          
          <div>
            <Label>
              Pitch: {settings.aiVoicePitch.toFixed(2)}
            </Label>
            <Input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.aiVoicePitch}
              onChange={(e) => setSettings(prev => ({ ...prev, aiVoicePitch: parseFloat(e.target.value) }))}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">0.5 (low) - 2.0 (high)</p>
          </div>
          
          <div>
            <Label>
              Volume: {settings.aiVoiceVolume.toFixed(2)}
            </Label>
            <Input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.aiVoiceVolume}
              onChange={(e) => setSettings(prev => ({ ...prev, aiVoiceVolume: parseFloat(e.target.value) }))}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">0.0 (mute) - 1.0 (full)</p>
          </div>
        </div>
      </Card>

      {/* Voice Testing */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Test Voice</h3>
        
        <div className="space-y-4">
          <div>
            <Label>Test Text</Label>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full p-3 border rounded-lg"
              rows={3}
              placeholder="Enter text to test voice..."
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={speak} disabled={isSpeaking} type="button">
              <Play className="w-4 h-4 mr-2" />
              {isSpeaking ? "Speaking..." : "Play Voice"}
            </Button>
            <Button onClick={stop} variant="outline" type="button">
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>
          </div>
        </div>
      </Card>

      {/* Custom Voice Recording */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Custom Voice Recording
        </h3>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-2">Voice Recording Script:</p>
                <p className="mb-2">Real human ko yeh script padhni hogi recording ke liye:</p>
                <p className="font-mono bg-white p-3 rounded border text-xs">
                  {settings.aiVoiceScript}
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label>Recording Script (What to say)</Label>
            <textarea
              value={settings.aiVoiceScript}
              onChange={(e) => setSettings(prev => ({ ...prev, aiVoiceScript: e.target.value }))}
              className="w-full p-3 border rounded-lg"
              rows={4}
              placeholder="Enter the script that the person should read for voice recording..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Ye script real human ko padhni hogi recording ke liye. Recording ke baad AI same voice clone karke use karega.
            </p>
          </div>

          <div className="flex gap-2">
            {!isRecording ? (
              <Button onClick={startRecording} type="button" variant="outline">
                <Mic className="w-4 h-4 mr-2" />
                Start Recording
              </Button>
            ) : (
              <Button onClick={stopRecording} type="button" variant="destructive">
                <Square className="w-4 h-4 mr-2" />
                Stop Recording
              </Button>
            )}
          </div>

          {recordedAudio && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <audio src={recordedAudio} controls className="w-full" />
              <p className="text-xs text-gray-600 mt-2">
                Recording complete. Please upload this audio file below.
              </p>
            </div>
          )}

          <div>
            <Label>Upload Voice File (Audio)</Label>
            <p className="text-xs text-gray-500 mb-2">
              Upload recorded audio file (MP3, WAV, WebM, OGG) or use recording above
            </p>
            <Input
              type="file"
              accept="audio/*"
              onChange={handleAudioUpload}
              className="cursor-pointer"
            />
            {settings.aiCustomVoiceUrl && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-800">Voice file uploaded:</p>
                <audio src={settings.aiCustomVoiceUrl} controls className="w-full mt-2" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSettings(prev => ({ ...prev, aiCustomVoiceUrl: "" }))}
                  className="mt-2"
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </div>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Voice cloning requires external services (like ElevenLabs, Google Cloud TTS, etc.). 
              Currently, uploaded voice files will be stored and can be used with external voice cloning APIs in the future.
            </p>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          Save Voice Settings
        </Button>
      </div>
    </div>
  );
}

