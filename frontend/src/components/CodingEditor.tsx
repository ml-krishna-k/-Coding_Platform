import { useState, useEffect } from 'react';
import { Play, RotateCcw, ChevronDown, Monitor, Terminal, Settings } from 'lucide-react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/themes/prism-tomorrow.css'; // Dark theme

import { emotionConfig } from '../data/emotionConfig';
import { useAffectState } from '../hooks/useAffectState';
import type { EmotionScores } from '../types';
import { problems } from '../data/problems';
import type { Problem } from '../data/problems';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface CodingEditorProps {
    scores?: EmotionScores;
}

type ExecutionResult = {
    testCaseId: number;
    status: 'Accepted' | 'Wrong Answer' | 'Runtime Error';
    output: string;
    expected: string;
    isCorrect: boolean;
    logs?: string[];
};

export default function CodingEditor({ scores }: CodingEditorProps) {
    const affectState = useAffectState(scores);
    const config = emotionConfig[affectState.mode] || emotionConfig['neutral'] || {};
    const uiConfig = config.ui || {};
    const hintConfig = config.hints || {};

    // -- State --
    const [activeProblem, setActiveProblem] = useState<Problem>(problems[0]);
    const [language, setLanguage] = useState<'javascript' | 'python' | 'java'>('javascript');
    const [code, setCode] = useState(activeProblem.starterCode[language]);
    const [activeTab, setActiveTab] = useState<'description' | 'solutions' | 'submissions'>('description');
    const [consoleTab, setConsoleTab] = useState<'testcase' | 'result'>('testcase');

    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<ExecutionResult[] | null>(null);
    const [activeTestCaseId, setActiveTestCaseId] = useState<number>(0); // Index in testCases array

    // Reset when problem changes
    useEffect(() => {
        setCode(activeProblem.starterCode[language]);
        setResults(null);
        setConsoleTab('testcase');
        setActiveTestCaseId(0);
    }, [activeProblem, language]);

    // -- Handlers --

    const handleRun = async () => {
        setIsRunning(true);
        setConsoleTab('result');

        // Simulate network delay / "Processing"
        await new Promise(r => setTimeout(r, 600 + Math.random() * 500));

        // Mock Execution Engine
        // For JS, we can actually try to run it. For others, we mock.
        let execResults: ExecutionResult[] = [];

        if (language === 'javascript') {
            try {
                // Dangerous but functional for client-side demo
                // Wrap code to return the function
                const userCode = code + `\nreturn ${activeProblem.slug === 'two-sum' ? 'twoSum' : 'isPalindrome'};`;
                const solutionFn = new Function(userCode)();

                execResults = activeProblem.testCases.map(tc => {
                    let logs: string[] = [];
                    // Mock console.log
                    const originalLog = console.log;
                    console.log = (...args) => logs.push(args.join(' '));

                    try {
                        // Determine if we need to spread args or pass array
                        // Our parsedInput is an array of args [arg1, arg2]
                        const result = solutionFn(...tc.parsedInput);
                        const isCorrect = JSON.stringify(result) === JSON.stringify(tc.expected);

                        return {
                            testCaseId: tc.id,
                            status: isCorrect ? 'Accepted' : 'Wrong Answer',
                            output: JSON.stringify(result),
                            expected: JSON.stringify(tc.expected),
                            isCorrect,
                            logs
                        };
                    } catch (e: any) {
                        return {
                            testCaseId: tc.id,
                            status: 'Runtime Error',
                            output: e.message || 'Error',
                            expected: JSON.stringify(tc.expected),
                            isCorrect: false,
                            logs
                        };
                    } finally {
                        console.log = originalLog;
                    }
                });

            } catch (e: any) {
                // Syntax error in defining function
                execResults = activeProblem.testCases.map(tc => ({
                    testCaseId: tc.id,
                    status: 'Runtime Error',
                    output: e.message,
                    expected: JSON.stringify(tc.expected),
                    isCorrect: false
                }));
            }
        } else {
            // Python/Java Mock
            execResults = activeProblem.testCases.map(tc => ({
                testCaseId: tc.id,
                status: 'Accepted', // Optimistic mock
                output: tc.output,
                expected: tc.output,
                isCorrect: true
            }));
        }

        setResults(execResults);
        setIsRunning(false);
    };

    // Determine Overall Status
    const overallStatus = results
        ? (results.every(r => r.isCorrect) ? 'Accepted' : results.find(r => r.status === 'Runtime Error') ? 'Runtime Error' : 'Wrong Answer')
        : null;

    return (
        <div className="flex h-screen w-full flex-col bg-[#1a1a1a] text-white font-sans overflow-hidden">

            {/* 1. Header (LeetCode Style) */}
            <header className="h-12 border-b border-[#282828] bg-[#1a1a1a] flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded flex items-center justify-center font-bold text-black text-xs">
                            K
                        </div>
                        <span className="font-medium text-slate-300">KrishCode</span>
                    </div>

                    {/* Problem List */}
                    <div className="relative group">
                        <button className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
                            Problem List <ChevronDown className="w-4 h-4" />
                        </button>
                        {/* Dropdown */}
                        <div className="absolute top-full left-0 mt-2 w-64 bg-[#282828] border border-[#3e3e3e] rounded-lg shadow-xl py-2 hidden group-hover:block z-50">
                            {problems.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setActiveProblem(p)}
                                    className={cn("w-full text-left px-4 py-2 text-sm hover:bg-[#3e3e3e]",
                                        activeProblem.id === p.id ? "text-orange-400" : "text-slate-300"
                                    )}
                                >
                                    {p.id}. {p.title}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Center: Affect State Indicator */}
                <div className={cn("px-4 py-1 rounded-full text-xs font-bold tracking-wide transition-all border",
                    affectState.mode === 'angry_frustrated' ? "bg-red-500/10 border-red-500 text-red-400" :
                        affectState.mode === 'confused' ? "bg-yellow-500/10 border-yellow-500 text-yellow-400" :
                            affectState.mode === 'focused' ? "bg-purple-500/10 border-purple-500 text-purple-400" :
                                affectState.mode === 'tired' ? "bg-blue-500/10 border-blue-500 text-blue-400" :
                                    affectState.mode === 'calm_exploratory' ? "bg-green-500/10 border-green-500 text-green-400" :
                                        "bg-white/5 border-white/10 text-slate-400"
                )}>
                    {affectState.mode === 'neutral' ? 'Standard Mode' : `${affectState.mode.replace('_', ' ').toUpperCase()} MODE`}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                    <button className="p-2 text-slate-400 hover:bg-[#282828] rounded"><Settings className="w-4 h-4" /></button>
                    <div className="w-px h-6 bg-[#282828] mx-1" />
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRun}
                            disabled={isRunning}
                            className="flex items-center gap-2 px-4 py-1.5 bg-[#2c2c2c] hover:bg-[#363636] border border-transparent hover:border-white/10 rounded text-sm font-medium transition-all text-slate-300"
                        >
                            <Play className="w-3 h-3 fill-current" /> Run
                        </button>
                        <button className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded text-sm font-medium shadow-lg shadow-green-900/20 transition-all">
                            Submit
                        </button>
                    </div>
                </div>
            </header>

            {/* 2. Main Content (Split View) */}
            <div className="flex-1 flex overflow-hidden">

                {/* LEFT PANEL: Problem Description */}
                <div className="w-1/2 min-w-[300px] border-r border-[#282828] flex flex-col bg-[#1a1a1a]">
                    {/* Tabs */}
                    <div className="bg-[#282828] h-10 flex items-center px-2 gap-1 border-b border-[#282828]">
                        {['Description', 'Solutions', 'Submissions'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={cn("px-4 h-full text-xs font-medium flex items-center gap-2 border-b-2 hover:bg-[#1a1a1a]",
                                    activeTab === tab.toLowerCase() ? "border-white text-white bg-[#1a1a1a]" : "border-transparent text-slate-400"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <h1 className="text-xl font-bold mb-4">{activeProblem.id}. {activeProblem.title}</h1>
                        <div className="flex gap-2 mb-6">
                            <span className={cn("px-3 py-1 rounded-full bg-white/10 text-xs font-medium",
                                activeProblem.difficulty === 'Easy' ? "text-green-400" :
                                    activeProblem.difficulty === 'Medium' ? "text-yellow-400" : "text-red-400"
                            )}>
                                {activeProblem.difficulty}
                            </span>
                        </div>

                        {/* Use dangerous HTML for rich description */}
                        <div
                            className="prose prose-invert prose-sm max-w-none text-slate-300"
                            dangerouslySetInnerHTML={{ __html: activeProblem.description }}
                        />

                        {/* Hints Section */}
                        {hintConfig.auto_show && hintConfig.examples && (
                            <div className={cn("mb-6 p-4 rounded-lg border animate-in fade-in slide-in-from-top-2 duration-700",
                                hintConfig.tone === 'neutral_strict' ? "bg-red-500/5 border-red-500/30" :
                                    hintConfig.tone === 'guiding' ? "bg-blue-500/5 border-blue-500/30" :
                                        hintConfig.tone === 'gentle' ? "bg-indigo-500/5 border-indigo-500/30" :
                                            "bg-yellow-500/5 border-yellow-500/30"
                            )}>
                                <h3 className={cn("text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-2",
                                    hintConfig.tone === 'neutral_strict' ? "text-red-400" :
                                        hintConfig.tone === 'guiding' ? "text-blue-400" :
                                            "text-yellow-400"
                                )}>
                                    {hintConfig.tone === 'neutral_strict' ? '⚠️ Correction Needed' :
                                        hintConfig.tone === 'guiding' ? '💡 Thought Process' :
                                            hintConfig.tone === 'gentle' ? '☕ Wellness Check' : '✨ Insight'}
                                </h3>
                                <ul className="space-y-2">
                                    {(hintConfig.max_hints ? hintConfig.examples.slice(0, hintConfig.max_hints) : hintConfig.examples).map((ex, i) => (
                                        <li key={i} className="text-sm text-slate-300 flex gap-2">
                                            <span>•</span>
                                            <span>{ex}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Constraints */}
                        <div className="mt-8">
                            <h3 className="text-sm font-bold mb-2 text-slate-200">Constraints:</h3>
                            <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                                {activeProblem.constraints.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: Editor & Console */}
                <div className="flex-1 flex flex-col min-w-[300px]">

                    {/* EDITOR SECTION */}
                    <div className="flex-1 flex flex-col border-b border-[#282828] min-h-[50%]">
                        {/* Toolbar */}
                        <div className="h-10 border-b border-[#282828] bg-[#1a1a1a] flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value as any)}
                                    className="bg-[#282828] text-xs text-slate-300 rounded px-2 py-1 outline-none border border-white/5 hover:border-white/20"
                                >
                                    <option value="javascript">JavaScript</option>
                                    <option value="python">Python</option>
                                    <option value="java">Java</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500">
                                <button onClick={() => setCode(activeProblem.starterCode[language])} title="Reset Code" className="p-1 hover:text-white"><RotateCcw className="w-3 h-3" /></button>
                            </div>
                        </div>

                        {/* Code Area */}
                        <div className={cn("flex-1 relative bg-[#1e1e1e] overflow-y-auto transition-colors duration-500",
                            uiConfig.theme === 'dark_cool' ? "bg-[#151b23]" : "",
                            affectState.mode === 'tired' ? "sepia-[0.2]" : ""
                        )}
                            style={{
                                fontSize: uiConfig.font_size_adjustment ? `${14 * uiConfig.font_size_adjustment}px` : undefined,
                                filter: uiConfig.brightness_adjustment ? `brightness(${1 + uiConfig.brightness_adjustment})` : undefined
                            }}>
                            <Editor
                                value={code}
                                onValueChange={setCode}
                                highlight={code => highlight(code,
                                    language === 'javascript' ? languages.javascript :
                                        language === 'python' ? languages.python :
                                            languages.java,
                                    language)}
                                padding={20}
                                className="font-mono text-[13px] min-h-full"
                                textareaClassName="focus:outline-none"
                                style={{
                                    fontFamily: '"Fira Code", "Fira Mono", monospace',
                                    fontSize: 14,
                                    backgroundColor: 'transparent',
                                }}
                            />
                        </div>
                    </div>

                    {/* CONSOLE SECTION */}
                    <div className="h-[200px] flex flex-col bg-[#1a1a1a]">
                        {/* Tabs */}
                        <div className="h-9 border-b border-[#282828] flex items-center px-4 gap-6 bg-[#1a1a1a]">
                            <button
                                onClick={() => setConsoleTab('testcase')}
                                className={cn("h-full text-xs font-medium flex items-center gap-2 border-b-2 relative top-[1px]",
                                    consoleTab === 'testcase' ? "border-white text-white" : "border-transparent text-slate-500"
                                )}
                            >
                                <Terminal className="w-3 h-3" /> Testcase
                            </button>
                            <button
                                onClick={() => setConsoleTab('result')}
                                className={cn("h-full text-xs font-medium flex items-center gap-2 border-b-2 relative top-[1px]",
                                    consoleTab === 'result' ? (overallStatus === 'Accepted' ? "text-green-500 border-green-500" : overallStatus ? "text-red-500 border-red-500" : "text-white border-white") : "border-transparent text-slate-500",
                                    !results && "text-slate-600 cursor-not-allowed peer-disabled:opacity-50"
                                )}
                                disabled={!results}
                            >
                                <Monitor className="w-3 h-3" /> Test Result
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {consoleTab === 'testcase' ? (
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        {activeProblem.testCases.map((tc, idx) => (
                                            <button
                                                key={tc.id}
                                                onClick={() => setActiveTestCaseId(idx)}
                                                className={cn("px-4 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                                    activeTestCaseId === idx ? "bg-[#2c2c2c] text-white" : "text-slate-500 hover:bg-[#2c2c2c]/50"
                                                )}
                                            >
                                                Case {tc.id}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs text-slate-500 font-medium block mb-1">Input</label>
                                            <div className="bg-[#282828] p-3 rounded-lg text-sm font-mono text-slate-300">
                                                {activeProblem.testCases[activeTestCaseId].input}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // RESULT VIEW
                                <div className="h-full">
                                    {!results ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-600">
                                            <span className="text-sm">Run your code to see results</span>
                                        </div>
                                    ) : isRunning ? (
                                        <div className="h-full flex items-center justify-center gap-2 text-slate-400">
                                            <div className="w-4 h-4 border-2 border-slate-600 border-t-white rounded-full animate-spin" />
                                            Running...
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <h2 className={cn("text-lg font-bold",
                                                    overallStatus === 'Accepted' ? "text-green-500" : "text-red-500"
                                                )}>{overallStatus}</h2>
                                                <span className="text-xs text-slate-500">Runtime: 56ms</span>
                                            </div>

                                            <div className="flex gap-2">
                                                {results.map((r, idx) => (
                                                    <button
                                                        key={r.testCaseId}
                                                        onClick={() => setActiveTestCaseId(idx)}
                                                        className={cn("px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors",
                                                            activeTestCaseId === idx ? "bg-[#2c2c2c] text-white" : "text-slate-500 hover:bg-[#2c2c2c]/50",
                                                        )}
                                                    >
                                                        <span className={cn("w-1.5 h-1.5 rounded-full",
                                                            r.isCorrect ? "bg-green-500" : "bg-red-500"
                                                        )} />
                                                        Case {r.testCaseId}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-xs text-slate-500 font-medium block mb-1">Output</label>
                                                    <div className={cn("bg-[#282828] p-3 rounded-lg text-sm font-mono",
                                                        results[activeTestCaseId].isCorrect ? "text-white" : "text-red-300"
                                                    )}>
                                                        {results[activeTestCaseId].output}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500 font-medium block mb-1">Expected</label>
                                                    <div className="bg-[#282828] p-3 rounded-lg text-sm font-mono text-slate-300">
                                                        {results[activeTestCaseId].expected}
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
