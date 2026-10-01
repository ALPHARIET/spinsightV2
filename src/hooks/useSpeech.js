import { useCallback, useEffect, useRef, useState } from 'react';

const MIC_DENIED = 'Izin mikrofon ditolak. Aktifkan izin mikrofon, atau ketik jawabanmu.';

export function useSpeech({ onFinal } = {}) {
  const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
  const supported = Boolean(SR);

  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState('');

  const recRef = useRef(null);
  const wantRef = useRef(false);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  const stop = useCallback(() => {
    wantRef.current = false;
    try { recRef.current?.stop(); } catch {}
    recRef.current = null;
    setRecording(false);
    setInterim('');
  }, []);

  const start = useCallback(() => {
    setError('');
    if (!supported) {
      setError('Peramban ini belum mendukung pengenalan suara. Pakai Chrome/Edge, atau ketik jawabanmu.');
      return;
    }
    const rec = new SR();
    rec.lang = 'id-ID';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (ev) => {
      let tmp = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) onFinalRef.current?.(r[0].transcript.trim());
        else tmp += r[0].transcript;
      }
      setInterim(tmp);
    };
    rec.onerror = (ev) => {
      if (ev.error === 'not-allowed') {
        setError(MIC_DENIED);
        stop();
      } else if (ev.error !== 'no-speech' && ev.error !== 'aborted') {
        setError(`Mikrofon bermasalah (${ev.error}).`);
      }
    };
    rec.onend = () => {
      if (wantRef.current) {
        try { rec.start(); } catch {}
      }
    };
    try {
      rec.start();
      recRef.current = rec;
      wantRef.current = true;
      setRecording(true);
    } catch {
      setError('Gagal menyalakan mikrofon.');
    }
  }, [supported, SR, stop]);

  useEffect(() => () => stop(), [stop]);

  return { supported, recording, interim, error, start, stop, setError };
}
