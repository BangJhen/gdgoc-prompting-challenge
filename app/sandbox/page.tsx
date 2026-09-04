'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryState } from 'nuqs';
import Image from 'next/image';
import { CardStorage } from '@/lib/card-storage';
import { Card } from '@/types/card';
import posthog from 'posthog-js';

// Animated score counter component with ease-out animation
const AnimatedScore: React.FC<{ targetScore: number; duration?: number }> = ({
    targetScore,
    duration = 3000
}) => {
    const [currentScore, setCurrentScore] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        if (targetScore > 0 && !hasAnimated) {
            setHasAnimated(true);
            const startTime = Date.now();

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeOutProgress = 1 - Math.pow(1 - progress, 4);
                const currentValue = Math.floor(targetScore * easeOutProgress);
                setCurrentScore(currentValue);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            requestAnimationFrame(animate);
        }
    }, [targetScore, duration, hasAnimated]);

    return <span>{currentScore}/100</span>;
};

const GAME_TIPS = [
    'Be specific about colors and shapes',
    'Describe the mood and style clearly',
    'Use descriptive adjectives for your pixel art',
    'Think about background colors and contrast',
    'Mention specific characters, objects, or scenes',
    'Try "16-bit retro game style" for pixel art',
    'Describe the lighting and color palette',
    'Start simple, then add details in next prompts',
];

const MAX_PROMPT_COUNT = 5;

function SandboxPageContent() {
    const [loading, setLoading] = useState(false);
    const [promptInput, setPromptInput] = useState('');
    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    const searchParams = useSearchParams();
    const router = useRouter();
    const [promptCount, setPromptCount] = useState(MAX_PROMPT_COUNT);

    const [selectedCardId, setSelectedCardId] = useQueryState('selectedImage');
    const [username] = useQueryState('username');

    const [previousCard, setPreviousCard] = useState<Card | null>(null);
    const [currentCard, setCurrentCard] = useState<Card | null>(null);

    // The currently displayed AI-generated image (base64 data URL or URL)
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    // History of all generated images for version selection
    const [generationHistory, setGenerationHistory] = useState<{ id: number; prompt: string; imageUrl: string }[]>([]);
    const [showVersionModal, setShowVersionModal] = useState(false);

    const [challengeCompleted, setChallengeCompleted] = useState(false);
    const [similarityScore, setSimilarityScore] = useState<number | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStatus, setGenerationStatus] = useState('');

    const [judgingStatus, setJudgingStatus] = useState<
        'submitting' | 'grading' | 'completed-bridging' | 'completed-first-own' | 'completed-higher-score' | 'completed-lower-score' | 'failed' | null
    >(null);

    const [backgroundMusic] = useState(() => {
        if (typeof window !== 'undefined') {
            const audio = new Audio('/audio/game-song.mp3');
            audio.loop = true;
            audio.volume = 0.3;
            return audio;
        }
        return null;
    });

    useEffect(() => {
        return () => {
            backgroundMusic?.pause();
        };
    }, [backgroundMusic]);

    const startMusic = () => {
        backgroundMusic?.play().catch(() => {});
    };

    useEffect(() => {
        if (selectedCardId) {
            CardStorage.getCardById(parseInt(selectedCardId)).then(setCurrentCard);
        }
    }, [selectedCardId]);

    // Cycle through game tips
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTipIndex((prev) => (prev + 1) % GAME_TIPS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const resetGame = () => {
        router.push('/');
    };

    // Called after user picks a version (or immediately if only 1 version)
    const submitFinalResult = async (chosenImageUrl: string) => {
        const selectedFaculty = searchParams.get('selectedFaculty');
        const previousCardLocal = selectedCardId
            ? await CardStorage.getCardById(parseInt(selectedCardId))
            : null;
        setPreviousCard(previousCardLocal);

        setShowVersionModal(false);
        setJudgingStatus('submitting');
        setLoading(true);

        try {
            setGeneratedImage(chosenImageUrl);

            // Load original image as blob
            const originalImageResponse = await fetch(
                previousCardLocal?.image || `/images/image-${selectedCardId}.png`
            );
            if (!originalImageResponse.ok) throw new Error('Failed to load original image');
            const originalImageBlob = await originalImageResponse.blob();

            // Load generated image as blob
            const generatedResponse = await fetch(chosenImageUrl);
            const generatedBlob = await generatedResponse.blob();

            // Compare images
            setJudgingStatus('grading');
            const formData = new FormData();
            formData.append('original', originalImageBlob, 'original.png');
            formData.append('generated', generatedBlob, 'generated.png');

            const similarityResponse = await fetch('/api/decide-similarity', {
                method: 'POST',
                body: formData,
            });
            if (!similarityResponse.ok) throw new Error('Failed to analyze similarity');
            const similarityData = await similarityResponse.json();

            setJudgingStatus('completed-bridging');
            setSimilarityScore(similarityData.score);
            setChallengeCompleted(true);

            if (selectedCardId && username) {
                const faculty = searchParams.get('selectedFaculty') || '';
                const prodi = searchParams.get('selectedProdi') || faculty || '';
                await CardStorage.updateCardBestScore(parseInt(selectedCardId), {
                    name: username,
                    faculty,
                    prodi,
                    score: similarityData.score,
                });

                if (previousCardLocal?.best?.score === null || previousCardLocal?.best?.score === undefined) {
                    setTimeout(() => setJudgingStatus('completed-first-own'), 500);
                    posthog.capture('finished_challenge', { selectedCardId, username, similarityScore: similarityData.score, type: 'first_own' });
                } else if (similarityData.score < previousCardLocal.best.score) {
                    setTimeout(() => setJudgingStatus('completed-lower-score'), 3000);
                    posthog.capture('finished_challenge', { selectedCardId, username, similarityScore: similarityData.score, type: 'lower_score' });
                } else {
                    setTimeout(() => setJudgingStatus('completed-higher-score'), 3000);
                    posthog.capture('finished_challenge', { selectedCardId, username, similarityScore: similarityData.score, type: 'higher_score' });
                }
            }
        } catch (error: any) {
            console.error('Finish challenge error:', error);
            setJudgingStatus('failed');
        } finally {
            setLoading(false);
        }
    };

    const finishChallenge = async () => {
        if (!generatedImage && generationHistory.length === 0) {
            alert('Please generate at least one image before finishing!');
            return;
        }

        if (generationHistory.length > 1) {
            setShowVersionModal(true);
            return;
        }

        const imageToSubmit = generationHistory[0]?.imageUrl || generatedImage;
        if (imageToSubmit) {
            await submitFinalResult(imageToSubmit);
        }
    };

    const sendPrompt = async () => {
        const message = promptInput.trim();
        if (!message) return;
        if (promptCount === 0) return;

        startMusic();
        setPromptCount((prev) => prev - 1);
        setIsGenerating(true);
        setGenerationStatus('Sending your prompt to AI...');
        setPromptInput('');

        try {
            setGenerationStatus('Generating your pixel art image...');

            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: message }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Generation failed');
            }

            let imageUrl: string;

            if (data.imageBase64) {
                imageUrl = `data:image/png;base64,${data.imageBase64}`;
            } else if (data.imageUrl) {
                imageUrl = data.imageUrl;
            } else {
                throw new Error('No image data in response');
            }

            setGeneratedImage(imageUrl);
            setGenerationHistory((prev) => [
                ...prev,
                { id: prev.length + 1, prompt: message, imageUrl },
            ]);
        } catch (error: any) {
            console.error('Generation error:', error);
            setGenerationStatus(`Error: ${error.message}`);
        } finally {
            setIsGenerating(false);
            setGenerationStatus('');
        }
    };

    return (
        <div className="font-sans bg-background text-foreground h-screen flex flex-col">
            {/* Version Selection Modal */}
            {showVersionModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col">
                        <div className="px-6 py-4 border-b flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Choose Your Best Version</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Select which result you want to submit for scoring</p>
                            </div>
                            <button
                                onClick={() => setShowVersionModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>
                        <div className="overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1">
                            {generationHistory.map((version) => (
                                <div
                                    key={version.id}
                                    className="flex flex-col rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="relative bg-gray-50 aspect-square overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={version.imageUrl}
                                            alt={`Version ${version.id}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                                            v{version.id}
                                        </div>
                                    </div>
                                    <div className="p-3 flex-1 flex flex-col justify-between">
                                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                            <span className="font-semibold text-gray-800">Prompt: </span>
                                            {version.prompt}
                                        </p>
                                        <button
                                            onClick={() => submitFinalResult(version.imageUrl)}
                                            className="w-full py-1.5 text-sm font-semibold bg-[#4285F4] hover:bg-blue-600 text-white rounded-lg transition-colors"
                                        >
                                            Submit this version
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Judging / Results Modal */}
            {judgingStatus && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-scroll">
                        <div className="p-8">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">Challenge Results</h2>
                                <p className="text-gray-600">{"Let's see how your creation compares to the original!"}</p>
                            </div>

                            {/* Image Comparison */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                {/* Original Image */}
                                <div className="text-center">
                                    <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                                        <div className="relative w-full h-48 mb-4">
                                            {currentCard && (
                                                <Image
                                                    src={currentCard.image}
                                                    alt={currentCard.name}
                                                    fill
                                                    className="object-contain rounded-lg"
                                                />
                                            )}
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-1">Original Design</h3>
                                        <p className="text-sm text-gray-500">Target to recreate</p>
                                    </div>
                                </div>

                                {/* Generated Image */}
                                <div className="text-center">
                                    <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                                        <div className="relative w-full h-48 mb-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
                                            {generatedImage ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={generatedImage}
                                                    alt="Your Generation"
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                                    <span className="text-sm">Your Creation</span>
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-1">Your Creation</h3>
                                        <p className="text-sm text-gray-500">AI-generated result</p>
                                    </div>
                                </div>
                            </div>

                            {/* Previous Best Score */}
                            {previousCard?.best && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
                                    <h4 className="text-lg font-semibold text-amber-800 mb-3">Previous Best Score</h4>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-2xl font-bold font-sans text-amber-700">{previousCard.best.score}/100</p>
                                            <p className="text-sm text-amber-600">by {previousCard.best.name}</p>
                                            <p className="text-xs text-amber-500">{previousCard.best.faculty}</p>
                                        </div>
                                        <svg className="w-8 h-8 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                    </div>
                                </div>
                            )}

                            {/* Status */}
                            <div className="text-center">
                                {judgingStatus === 'submitting' && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                                        <div className="flex items-center justify-center gap-3 mb-3">
                                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-lg font-semibold text-blue-700">Submitting...</span>
                                        </div>
                                        <p className="text-sm text-blue-600">Loading your image for comparison...</p>
                                    </div>
                                )}

                                {judgingStatus === 'grading' && (
                                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                                        <div className="flex items-center justify-center gap-3 mb-3">
                                            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-lg font-semibold text-purple-700">AI is Analyzing...</span>
                                        </div>
                                        <p className="text-sm text-purple-600">Comparing your creation to the original...</p>
                                    </div>
                                )}

                                {(judgingStatus === 'completed-bridging' ||
                                    judgingStatus === 'completed-first-own' ||
                                    judgingStatus === 'completed-higher-score' ||
                                    judgingStatus === 'completed-lower-score') && (
                                    <div className={`rounded-xl p-6 border-2 ${
                                        similarityScore && similarityScore >= 70
                                            ? 'bg-green-50 border-green-200'
                                            : 'bg-blue-50 border-blue-200'
                                    }`}>
                                        {judgingStatus === 'completed-bridging' && (
                                            <div className="flex items-center justify-center gap-3 mb-3">
                                                <div className="w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                                                <span className="text-lg font-semibold text-gray-700">Calculating final score...</span>
                                            </div>
                                        )}

                                        {judgingStatus === 'completed-first-own' && (
                                            <div className="mb-4">
                                                <div className="text-4xl font-bold font-sans text-blue-600 mb-2">
                                                    <AnimatedScore targetScore={similarityScore || 0} />
                                                </div>
                                                <div className="flex items-center justify-center gap-2 text-blue-700">
                                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                    </svg>
                                                    <span className="text-lg font-semibold">First to Try!</span>
                                                </div>
                                                <p className="text-sm text-blue-600 mt-2">{"You're the first person to attempt this challenge!"}</p>
                                            </div>
                                        )}

                                        {judgingStatus === 'completed-higher-score' && (
                                            <div className="mb-4">
                                                <div className="text-4xl font-bold font-sans text-green-600 mb-2">
                                                    <AnimatedScore targetScore={similarityScore || 0} />
                                                </div>
                                                <div className="flex items-center justify-center gap-2 text-green-700">
                                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                    </svg>
                                                    <span className="text-lg font-semibold">New High Score!</span>
                                                </div>
                                                <p className="text-sm text-green-600 mt-2">Congratulations! You beat the previous record!</p>
                                            </div>
                                        )}

                                        {judgingStatus === 'completed-lower-score' && (
                                            <div className="mb-4">
                                                <div className="text-4xl font-bold font-sans text-blue-600 mb-2">
                                                    <AnimatedScore targetScore={similarityScore || 0} />
                                                </div>
                                                <div className="flex items-center justify-center gap-2 text-blue-700">
                                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                                    </svg>
                                                    <span className="text-lg font-semibold">Good Effort!</span>
                                                </div>
                                                <p className="text-sm text-blue-600 mt-2">Keep practicing to beat the current high score!</p>
                                            </div>
                                        )}

                                        {similarityScore !== null && (judgingStatus === 'completed-first-own' || judgingStatus === 'completed-higher-score' || judgingStatus === 'completed-lower-score') && (
                                            <div className="mt-4 text-sm text-gray-600">
                                                {similarityScore >= 90 && '🌟 Excellent! Nearly identical to the original!'}
                                                {similarityScore >= 70 && similarityScore < 90 && '💪 Great job! Very close to the original design!'}
                                                {similarityScore >= 50 && similarityScore < 70 && '👍 Good effort! Getting there with more practice!'}
                                                {similarityScore < 50 && '🎯 Keep going! Focus on the key visual elements!'}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {judgingStatus === 'failed' && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                                        <p className="text-red-700 font-semibold">Something went wrong during judging. Please try again.</p>
                                    </div>
                                )}
                            </div>

                            {/* Close / Continue */}
                            {(judgingStatus === 'completed-first-own' ||
                                judgingStatus === 'completed-higher-score' ||
                                judgingStatus === 'completed-lower-score') && (
                                <div className="text-center mt-8">
                                    <button
                                        onClick={resetGame}
                                        className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
                                    >
                                        Continue to Home
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Top Bar */}
            <div className="bg-card px-4 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Image src="/images/logo.png" alt="Logo" width={24} height={24} className="object-contain" />
                    <h1 className="text-lg font-semibold font-pixelify">Hello {username}! — GDGoC Prompting Challenge</h1>
                    <span className={`text-sm px-3 py-1.5 rounded-[10px] text-white font-medium [box-shadow:inset_0px_-2px_0px_0px_#171310,_0px_1px_6px_0px_rgba(58,_33,_8,_58%)] ${
                        challengeCompleted
                            ? 'bg-green-600'
                            : promptCount === 0
                            ? 'bg-blue-600'
                            : 'bg-blue-800'
                    }`}>
                        {challengeCompleted
                            ? `Score: ${similarityScore ?? 0}/100`
                            : promptCount === 0
                            ? 'Ready to Finish!'
                            : `Prompts Left: ${promptCount}`}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={resetGame}
                        className="inline-flex font-pixelify items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-[10px] text-sm font-medium [box-shadow:inset_0px_-2px_0px_0px_#171310] transition-all duration-200"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back
                    </button>
                    <button
                        onClick={finishChallenge}
                        disabled={loading || challengeCompleted || (generationHistory.length === 0 && !generatedImage)}
                        className="inline-flex font-pixelify items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white px-3 py-1.5 rounded-[10px] text-sm font-medium [box-shadow:inset_0px_-2px_0px_0px_#171310] transition-all duration-200 disabled:cursor-not-allowed"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Finish Challenge
                    </button>
                </div>
            </div>

            {/* Main Layout: Left Chat/Prompt, Right Image Preview */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel: Chat + Prompt Input */}
                <div className="w-[380px] flex-shrink-0 border-r border-border flex flex-col bg-card">
                    {/* Target Image Reference */}
                    <div className="p-4 border-b border-border">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Target Image</p>
                        <div className="relative w-full h-32 bg-muted rounded-lg overflow-hidden border border-border">
                            {currentCard ? (
                                <Image
                                    src={currentCard.image}
                                    alt={currentCard.name || 'Target'}
                                    fill
                                    className="object-contain"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                                    No image selected
                                </div>
                            )}
                        </div>
                        {currentCard && (
                            <p className="text-xs text-muted-foreground mt-1 text-center">{currentCard.name}</p>
                        )}
                    </div>

                    {/* Generation History */}
                    {generationHistory.length > 0 && (
                        <div className="p-4 border-b border-border">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
                                Your Attempts ({generationHistory.length}/{MAX_PROMPT_COUNT})
                            </p>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {generationHistory.map((version) => (
                                    <div
                                        key={version.id}
                                        className="flex-shrink-0 relative w-16 h-16 bg-muted rounded-lg overflow-hidden border border-border cursor-pointer hover:border-blue-400 transition-colors"
                                        onClick={() => setGeneratedImage(version.imageUrl)}
                                        title={version.prompt}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={version.imageUrl} alt={`v${version.id}`} className="w-full h-full object-cover" />
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center">
                                            v{version.id}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tips */}
                    <div className="p-4 border-b border-border">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentTipIndex}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.4 }}
                                className="bg-blue-50 border border-blue-100 rounded-lg p-3"
                            >
                                <p className="text-xs text-blue-600 font-medium">💡 Tip</p>
                                <p className="text-sm text-blue-800 mt-0.5">{GAME_TIPS[currentTipIndex]}</p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Prompt Input */}
                    <div className="p-4 mt-auto border-t border-border">
                        <p className="text-xs text-muted-foreground font-medium mb-2">
                            Describe what you want to generate ({promptCount} attempts left)
                        </p>
                        <Textarea
                            value={promptInput}
                            onChange={(e) => setPromptInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (!isGenerating && promptCount > 0 && promptInput.trim()) {
                                        sendPrompt();
                                    }
                                }
                            }}
                            placeholder="e.g. A golden trophy on a dark background, retro pixel art style..."
                            className="resize-none mb-3 min-h-[100px] text-sm"
                            disabled={isGenerating || promptCount === 0 || challengeCompleted}
                        />
                        <button
                            onClick={sendPrompt}
                            disabled={isGenerating || promptCount === 0 || !promptInput.trim() || challengeCompleted}
                            className="w-full font-pixelify bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Generating...
                                </>
                            ) : promptCount === 0 ? (
                                'No attempts left'
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Generate Image
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Panel: Generated Image Display */}
                <div className="flex-1 flex flex-col bg-gray-50">
                    {isGenerating ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
                            <div className="relative">
                                <div className="w-24 h-24 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse' }} />
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-semibold text-gray-700 mb-1">Creating your pixel art...</h3>
                                <p className="text-sm text-gray-500">{generationStatus}</p>
                            </div>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentTipIndex}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-white border border-gray-200 rounded-xl p-4 max-w-sm text-center shadow-sm"
                                >
                                    <p className="text-sm text-gray-600">{GAME_TIPS[currentTipIndex]}</p>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    ) : generatedImage ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
                            <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-200 max-w-xl w-full">
                                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gray-50">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={generatedImage}
                                        alt="Generated pixel art"
                                        className="w-full h-full object-contain"
                                        style={{ imageRendering: 'pixelated' }}
                                    />
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    <p className="text-sm text-gray-500">
                                        Version {generationHistory.length} of {MAX_PROMPT_COUNT}
                                    </p>
                                    {generationHistory.length > 1 && (
                                        <button
                                            onClick={() => setShowVersionModal(true)}
                                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Compare versions →
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="text-sm text-gray-400 text-center max-w-md">
                                Happy with this result? Click <span className="font-semibold text-gray-600">Finish Challenge</span> to submit it for scoring.
                                {promptCount > 0 && " Or try another prompt to improve it!"}
                            </p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
                            <div className="w-32 h-32 bg-gray-200 rounded-2xl flex items-center justify-center">
                                <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">Your canvas is empty</h3>
                                <p className="text-sm text-gray-500 max-w-sm">
                                    Write a prompt on the left to generate your first pixel art image. Try to recreate the target image as closely as possible!
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SandboxPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <SandboxPageContent />
        </Suspense>
    );
}