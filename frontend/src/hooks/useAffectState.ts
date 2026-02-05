import { useState, useEffect, useRef } from 'react';
import type { EmotionScores, AffectState } from '../types';

export function useAffectState(scores: EmotionScores | undefined): AffectState {
    const [state, setState] = useState<AffectState>({
        stress: 0,
        bored: 0,
        confused: 0,
        confident: 0,
        mode: 'neutral',
    });

    const historyRef = useRef<EmotionScores[]>([]);
    const modeTimerRef = useRef<{ [key: string]: number }>({});
    const lastUpdateRef = useRef<number>(Date.now());

    useEffect(() => {
        if (!scores) return;

        const now = Date.now();
        const dt = (now - lastUpdateRef.current) / 1000; // seconds since last update
        lastUpdateRef.current = now;

        // 1. Normalize Scores
        const happy = scores.happy || scores.happiness || 0;
        const sad = scores.sad || scores.sadness || 0;
        const angry = scores.angry || scores.anger || 0;
        const fear = scores.fear || 0;
        const surprise = scores.surprise || 0;
        const neutral = scores.neutral || 0;

        // 2. Calculate Derived States (Instantaneous)
        const stress = angry + fear + sad;
        const confident = happy - fear;

        // Confused: "surprise + fear (with rising trend)"
        // logic: val = surprise + fear. trend = current > average_of_last_3
        const confusionBase = surprise + fear;

        // Update History
        historyRef.current.push(scores);
        if (historyRef.current.length > 20) historyRef.current.shift();

        // Calculate Trend for Confusion
        let confusionOutput = confusionBase;
        if (historyRef.current.length > 2) {
            const tail = historyRef.current.slice(-5); // last 5 frames
            const avgSurpriseFear = tail.reduce((acc, s) => acc + (s.surprise || 0) + (s.fear || 0), 0) / tail.length;
            if (confusionBase > avgSurpriseFear + 0.1) {
                // Rising
                confusionOutput += 0.2; // Boost if rising
            }
        }

        // 3. Temporal Logic for Modes
        // Angry/Frustrated: angry > 0.25 (sensitive) or stress > 0.4
        if (angry > 0.25 || stress > 0.4) {
            modeTimerRef.current['angry'] = (modeTimerRef.current['angry'] || 0) + dt;
        } else {
            modeTimerRef.current['angry'] = Math.max(0, (modeTimerRef.current['angry'] || 0) - dt);
        }

        // Tired: sad > 0.35 (sensitive)
        if (sad > 0.35) {
            modeTimerRef.current['tired'] = (modeTimerRef.current['tired'] || 0) + dt;
        } else {
            modeTimerRef.current['tired'] = Math.max(0, (modeTimerRef.current['tired'] || 0) - dt);
        }

        // Focused: neutral > 0.5
        if (neutral > 0.5) {
            modeTimerRef.current['focused'] = (modeTimerRef.current['focused'] || 0) + dt;
        } else {
            modeTimerRef.current['focused'] = 0; // reset quickly if lost
        }

        // Calm/Exploratory: happy > 0.25 or confident > 0.3
        if (happy > 0.25 || confident > 0.3) {
            modeTimerRef.current['calm'] = (modeTimerRef.current['calm'] || 0) + dt;
        } else {
            modeTimerRef.current['calm'] = 0;
        }

        // Confusion: signal based
        if (confusionOutput > 0.5) {
            modeTimerRef.current['confused'] = (modeTimerRef.current['confused'] || 0) + dt;
        } else {
            modeTimerRef.current['confused'] = 0;
        }

        // determine Mode
        let newMode: AffectState['mode'] = 'neutral';

        // Priority Logic
        if (modeTimerRef.current['angry'] >= 1.5) {
            newMode = 'angry_frustrated';
        } else if (modeTimerRef.current['confused'] >= 1.0) {
            newMode = 'confused';
        } else if (modeTimerRef.current['tired'] >= 2.5) {
            newMode = 'tired';
        } else if (modeTimerRef.current['calm'] >= 2.0) {
            newMode = 'calm_exploratory';
        } else if (modeTimerRef.current['focused'] >= 2.0) {
            newMode = 'focused';
        }

        setState({
            stress,
            bored: neutral,
            confused: confusionOutput,
            confident,
            mode: newMode
        });

    }, [scores]);

    return state;
}
