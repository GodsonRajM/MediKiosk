/**
 * MediKiosk Gemini Live Multimodal Voice Client
 * Securely communicates with Gemini Live API via short-lived ephemeral tokens from FastAPI.
 * Streams real-time 16kHz Linear PCM audio chunks and processes live clinical responses.
 */

import { ApiService } from "./api";

export type VoiceState = "idle" | "connecting" | "listening" | "processing" | "answered" | "error";

export interface VoiceCallback {
  onStateChange: (state: VoiceState, message?: string) => void;
  onTranscription: (transcript: string) => void;
  onAnswerExtracted: (answer: string) => void;
  onError: (error: string) => void;
}

export class GeminiLiveVoiceClient {
  private state: VoiceState = "idle";
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private ws: WebSocket | null = null;
  private callbacks: VoiceCallback;
  private language: string = "en";
  private questionText: string = "";
  private questionField: string = "";

  constructor(callbacks: VoiceCallback) {
    this.callbacks = callbacks;
  }

  public getState(): VoiceState {
    return this.state;
  }

  private setState(state: VoiceState, message?: string) {
    this.state = state;
    this.callbacks.onStateChange(state, message);
  }

  /**
   * Reads clinical question aloud using speech synthesis
   */
  public readQuestionAloud(text: string, language: string = "en"): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const langMap: Record<string, string> = {
        en: "en-IN",
        kn: "kn-IN",
        ta: "ta-IN",
        hi: "hi-IN",
      };
      utterance.lang = langMap[language] || "en-US";
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Starts microphone stream, acquires ephemeral token, and initiates live session
   */
  public async startVoiceIntake(questionText: string, questionField: string, language: string = "en") {
    this.questionText = questionText;
    this.questionField = questionField;
    this.language = language;

    if (this.state === "listening" || this.state === "connecting") {
      this.stop();
      return;
    }

    this.setState("connecting", "Initializing clinical microphone...");

    // 1. Request microphone permission
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone API is not supported on this device/browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.mediaStream = stream;
    } catch (permErr: any) {
      const errName = permErr.name || "";
      let msg = "Microphone access denied. Please grant permission in browser settings.";
      if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
        msg = "No microphone hardware detected on this device.";
      } else if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
        msg = "Microphone permission was denied. Tap allow in your browser or Android app settings.";
      }
      this.setState("error", msg);
      this.callbacks.onError(msg);
      this.cleanup();
      return;
    }

    // 2. Set up Audio Recorder for robust fallback & chunk capture
    this.recordedChunks = [];
    try {
      const options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        options.mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
        options.mimeType = "audio/ogg;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        options.mimeType = "audio/mp4";
      }

      this.mediaRecorder = new MediaRecorder(this.mediaStream, options);
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };
      this.mediaRecorder.start(250);
    } catch (recErr) {
      console.warn("[MediKiosk Voice] MediaRecorder init note:", recErr);
    }

    // 3. Attempt Live WebSocket connection with ephemeral token from backend
    let wsConnected = false;
    try {
      const baseUrl = ApiService.getBaseUrl();
      if (baseUrl) {
        const tokenRes = await ApiService["request"]<any>("/ai/live-token", { method: "POST" });
        if (tokenRes && tokenRes.websocket_url) {
          this.initWebSocket(tokenRes.websocket_url);
          wsConnected = true;
        }
      }
    } catch (wsErr) {
      console.warn("[MediKiosk Voice] Ephemeral WebSocket connection unavailable. Using direct multimodal audio intake...", wsErr);
    }

    this.setState("listening", "Listening... Please speak your answer.");

    // If using PCM streaming for live WebSocket
    if (wsConnected) {
      this.startPcmStreaming();
    }
  }

  private initWebSocket(url: string) {
    try {
      this.ws = new WebSocket(url);
      this.ws.onopen = () => {
        // Send initial setup message locking model instructions
        const setupMsg = {
          setup: {
            model: "models/gemini-2.0-flash-exp",
            generation_config: {
              response_modalities: ["TEXT"],
            },
            system_instruction: {
              parts: [
                {
                  text: `You are an OPD clinical kiosk assistant. The current question is: "${this.questionText}". Extract the clinical symptom or answer accurately. Language is ${this.language}.`,
                },
              ],
            },
          },
        };
        this.ws?.send(JSON.stringify(setupMsg));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.serverContent?.modelTurn?.parts) {
            for (const part of data.serverContent.modelTurn.parts) {
              if (part.text) {
                this.callbacks.onTranscription(part.text);
                this.callbacks.onAnswerExtracted(part.text);
              }
            }
          }
        } catch {}
      };

      this.ws.onerror = (err) => {
        console.warn("[MediKiosk Voice] WebSocket error:", err);
      };

      this.ws.onclose = () => {
        // WebSocket closed
      };
    } catch (e) {
      console.warn("[MediKiosk Voice] Failed to open WebSocket:", e);
    }
  }

  private startPcmStreaming() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: 16000 });
      if (!this.mediaStream) return;

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processorNode.onaudioprocess = (e) => {
        if (this.state !== "listening" || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to 16-bit PCM
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Convert PCM buffer to base64 safely without downlevel spread
        const bytes = new Uint8Array(pcm16.buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Audio = btoa(binary);

        const chunkMsg = {
          realtime_input: {
            media_chunks: [
              {
                mime_type: "audio/pcm;rate=16000",
                data: base64Audio,
              },
            ],
          },
        };
        this.ws.send(JSON.stringify(chunkMsg));
      };

      this.sourceNode.connect(this.processorNode);
      this.processorNode.connect(this.audioContext.destination);
    } catch (pcmErr) {
      console.warn("[MediKiosk Voice] PCM Streaming init note:", pcmErr);
    }
  }

  /**
   * Finishes speech recording, triggers processing, and returns structured result
   */
  public async stopAndSubmit(): Promise<{ transcription: string; answer: string }> {
    this.setState("processing", "Processing your clinical answer with Gemini AI...");

    // Stop MediaRecorder and collect full audio blob
    const audioBlob = await new Promise<Blob | null>((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
        resolve(this.recordedChunks.length > 0 ? new Blob(this.recordedChunks, { type: "audio/webm" }) : null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mime = this.mediaRecorder?.mimeType || "audio/webm";
        const blob = new Blob(this.recordedChunks, { type: mime });
        resolve(blob);
      };
      this.mediaRecorder.stop();
    });

    this.cleanup();

    if (!audioBlob || audioBlob.size < 500) {
      const err = "No voice recorded. Please tap speak and speak clearly.";
      this.setState("error", err);
      this.callbacks.onError(err);
      throw new Error(err);
    }

    // Call backend voice-transcribe
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "patient_speech.webm");
      formData.append("question_field", this.questionField);
      formData.append("question_text", this.questionText);
      formData.append("language", this.language);

      const res = await ApiService["request"]<any>("/ai/voice-transcribe", {
        method: "POST",
        body: formData,
      });

      const transcription = res.transcription || res.clinical_answer || "";
      const answer = res.clinical_answer || transcription || "";

      this.setState("answered", "Answer received");
      this.callbacks.onTranscription(transcription);
      this.callbacks.onAnswerExtracted(answer);

      return { transcription, answer };
    } catch (err: any) {
      console.warn("[MediKiosk Voice] Backend voice-transcribe note:", err);
      const errMsg = err.message || "Failed to process voice response.";
      this.setState("error", errMsg);
      this.callbacks.onError(errMsg);
      throw err;
    }
  }

  public stop() {
    this.cleanup();
    this.setState("idle");
  }

  private cleanup() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
  }
}
