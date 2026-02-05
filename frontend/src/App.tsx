import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Webcam from 'react-webcam';
import { Video, Clock, AlertTriangle, Smartphone } from 'lucide-react';
import CodingEditor from './components/CodingEditor';
import type { AnalysisResult } from './types';

function App() {
  const [mode] = useState<'live'>('live');
  const webcamRef = useRef<Webcam>(null);
  const [isLiveActive, setIsLiveActive] = useState(true);
  const [liveIntervalId, setLiveIntervalId] = useState<ReturnType<typeof setInterval> | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Focus/Session Timer
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  // Timer Logic
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isLiveActive) {
      if (!startTime) setStartTime(Date.now());
      timer = setInterval(() => {
        if (startTime) {
          setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }
      }, 1000);
    } else {
      setStartTime(null);
      setElapsedTime(0);
    }
    return () => clearInterval(timer);
  }, [isLiveActive, startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const performAnalysis = async (imageBlob: Blob) => {
    const formData = new FormData();
    formData.append('file', imageBlob, 'image.jpg');

    try {
      const response = await axios.post('http://localhost:8000/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Debounce State
  const [consecutiveStatus, setConsecutiveStatus] = useState<{ status: 'ok' | 'no_user' | 'mobile_detected'; count: number }>({ status: 'ok', count: 0 });
  const [debouncedStatus, setDebouncedStatus] = useState<'ok' | 'no_user' | 'mobile_detected'>('ok');

  // Update debounced status
  useEffect(() => {
    if (!result) return;

    if (result.status === consecutiveStatus.status) {
      const newCount = consecutiveStatus.count + 1;
      setConsecutiveStatus({ ...consecutiveStatus, count: newCount });

      // Trigger after 3 frames (approx 3 seconds)
      if (newCount >= 3) {
        setDebouncedStatus(result.status);
      }
    } else {
      // Reset if status changed
      setConsecutiveStatus({ status: result.status, count: 1 });
      if (result.status === 'ok') {
        // Immediate recovery is usually better UX, but let's stick to debounce or quick reset
        setDebouncedStatus('ok');
      }
    }
  }, [result]);

  // Sound Alarm Logic
  useEffect(() => {
    const stopAlarm = () => {
      if (oscillatorRef.current) {
        try { oscillatorRef.current.stop(); } catch (e) { }
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };

    const startAlarm = (type: 'loud' | 'mild') => {
      if (oscillatorRef.current) return; // Already running

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'loud') {
        // High volume, Continuous pattern
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(950, ctx.currentTime); // Higher pitch for urgency
        gain.gain.setValueAtTime(1.0, ctx.currentTime); // Max volume
        // "Continuous" - no pulsing
      } else {
        // Mild: Mobile Detected
        // Use 'square' or 'triangle' for a more distinct "digital" beep sound than sine
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.4, ctx.currentTime); // Louder

        // Fast Double Beep Pattern
        const pulse = setInterval(() => {
          if (ctx.state === 'closed') { clearInterval(pulse); return; }
          const t = ctx.currentTime;
          const now = Date.now();
          // Beep-Beep... Pause... Beep-Beep
          const cycle = now % 1000;
          if (cycle < 100 || (cycle > 200 && cycle < 300)) {
            gain.gain.setTargetAtTime(0.4, t, 0.02);
          } else {
            gain.gain.setTargetAtTime(0, t, 0.02);
          }
        }, 50);
      }

      osc.start();
      oscillatorRef.current = osc;
    };

    if (debouncedStatus === 'no_user') {
      startAlarm('loud');
    } else if (debouncedStatus === 'mobile_detected') {
      startAlarm('mild');
    } else {
      stopAlarm();
    }

    return () => stopAlarm();
  }, [debouncedStatus]);

  const toggleLive = () => {
    if (isLiveActive) {
      setIsLiveActive(false);
      if (liveIntervalId) clearInterval(liveIntervalId);
      setResult(null);
      setConsecutiveStatus({ status: 'ok', count: 0 });
      setDebouncedStatus('ok');
    } else {
      setIsLiveActive(true);
      setStartTime(Date.now());
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isLiveActive && mode === 'live') {
      interval = setInterval(async () => {
        if (webcamRef.current) {
          const imageSrc = webcamRef.current.getScreenshot();
          if (imageSrc) {
            const fetchRes = await fetch(imageSrc);
            const blob = await fetchRes.blob();
            await performAnalysis(blob);
          }
        }
      }, 1000);
      setLiveIntervalId(interval);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isLiveActive, mode]);

  useEffect(() => {
    return () => {
      if (liveIntervalId) clearInterval(liveIntervalId);
    };
  }, [mode]);

  return (
    <div className="bg-black min-h-screen font-sans text-slate-200 relative overflow-hidden">

      {/* ALERTS / OVERLAYS */}
      {debouncedStatus === 'no_user' && (
        <div className="fixed inset-0 z-[100] bg-red-900/90 flex flex-col items-center justify-center animate-pulse">
          <AlertTriangle className="w-48 h-48 text-white mb-8" />
          <h1 className="text-6xl font-black text-white uppercase tracking-widest mb-4">USER MISSING</h1>
          <p className="text-2xl text-red-200">Return to workstation immediately.</p>
          <div className="mt-8 text-white text-xl text-center">
            System Halted
            <button
              onClick={() => setDebouncedStatus('ok')}
              className="block mt-6 px-6 py-2 bg-red-600 border border-white/20 text-white rounded text-sm uppercase font-bold tracking-widest hover:bg-red-500 transition-colors pointer-events-auto"
            >
              Emergency Resume
            </button>
          </div>
        </div>
      )}

      {debouncedStatus === 'mobile_detected' && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center backdrop-blur-xl">
          <Smartphone className="w-32 h-32 text-blue-500 mb-8 animate-bounce" />
          <h1 className="text-4xl font-bold text-white mb-4">Mobile Device Detected</h1>
          <p className="text-xl text-slate-400 mb-8 max-w-lg text-center">
            Please put away your phone to continue. The session allows for no distractions.
          </p>
          <button
            onClick={toggleLive}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
          >
            Turn Off Model / Session
          </button>
        </div>
      )}

      {/* WEB CAM + INFO */}
      <div className={isLiveActive ? "fixed bottom-4 left-4 z-50 transition-all group" : "hidden"}>
        <div className="relative w-48 h-36 rounded-xl overflow-hidden shadow-2xl border border-white/20 bg-black hover:w-64 hover:h-48 transition-all duration-300">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ width: 320, height: 240, facingMode: "user" }}
            className="w-full h-full object-cover opacity-80"
          />

          {/* Session Timer Overlay */}
          <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded-md flex items-center gap-2 border border-white/10">
            <Clock className="w-3 h-3 text-green-400" />
            <span className="text-xs font-mono font-bold text-green-400">{formatTime(elapsedTime)}</span>
          </div>

          <div className="absolute top-2 right-2 flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>

          <button onClick={toggleLive} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs uppercase tracking-wider">
            Stop Session
          </button>
        </div>
      </div>

      {!isLiveActive && mode === 'live' && (
        <div className="fixed bottom-4 left-4 z-50">
          <button onClick={toggleLive} className="bg-accent text-slate-900 px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 hover:scale-105 transition-transform bg-green-400">
            <Video className="w-4 h-4" /> Start KrishCode Session
          </button>
        </div>
      )}

      <CodingEditor
        scores={result?.analysis?.all_scores || undefined}
      />
    </div>
  );
}

export default App;
