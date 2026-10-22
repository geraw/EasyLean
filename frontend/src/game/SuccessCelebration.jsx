import React, { useEffect, useRef } from 'react';
import { renderMarkdownLite } from './markdownLite';

// A solved level is celebrated in the middle of the screen: confetti, a
// headline, the level's conclusion and the button onwards. Closing it (the
// other button, Escape, or a click outside) leaves the conclusion on the side
// panel, as before, so the student can look at the proof and go on from there.

const COLOURS = ['#4CAF50', '#2196F3', '#FFC107', '#E91E63', '#9C27B0', '#FF5722', '#00BCD4'];

// Confetti on a canvas over the whole window: one burst from the middle,
// then the pieces fall and fade. Skipped when the system asks for less motion.
const Confetti = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!context) return undefined;
        const width = canvas.width = window.innerWidth;
        const height = canvas.height = window.innerHeight;
        const pieces = Array.from({ length: 160 }, () => {
            const angle = Math.random() * Math.PI * 2;
            const speed = 6 + Math.random() * 12;
            return {
                x: width / 2, y: height * 0.45,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 6,
                size: 6 + Math.random() * 8, spin: Math.random() * Math.PI, spinSpeed: (Math.random() - 0.5) * 0.3,
                colour: COLOURS[Math.floor(Math.random() * COLOURS.length)],
            };
        });
        const start = performance.now();
        let frame;
        const draw = (now) => {
            const elapsed = now - start;
            context.clearRect(0, 0, width, height);
            context.globalAlpha = Math.max(0, 1 - Math.max(0, elapsed - 2200) / 1000);
            pieces.forEach((piece) => {
                piece.vx *= 0.985;
                piece.vy = piece.vy * 0.985 + 0.35;
                piece.x += piece.vx;
                piece.y += piece.vy;
                piece.spin += piece.spinSpeed;
                context.save();
                context.translate(piece.x, piece.y);
                context.rotate(piece.spin);
                context.fillStyle = piece.colour;
                context.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2);
                context.restore();
            });
            if (elapsed < 3200) frame = requestAnimationFrame(draw);
        };
        frame = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(frame);
    }, []);
    return <canvas ref={canvasRef} aria-hidden="true" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1001 }} />;
};

const SuccessCelebration = ({ message, conclusion, nextLabel, onNext, onClose }) => {
    const nextRef = useRef(null);
    useEffect(() => {
        (nextRef.current || document.querySelector('[data-celebration-close]'))?.focus();
        const onKey = (event) => { if (event.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <>
            <style>{`
                @keyframes easyleanPop { 0% { transform: scale(0.6); opacity: 0; } 70% { transform: scale(1.04); opacity: 1; } 100% { transform: scale(1); } }
                @keyframes easyleanFade { from { opacity: 0; } to { opacity: 1; } }
                @media (prefers-reduced-motion: reduce) { .easyleanCelebration, .easyleanCelebrationBackdrop { animation: none !important; } }
            `}</style>
            <Confetti />
            <div
                className="easyleanCelebrationBackdrop"
                onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
                style={{ position: 'fixed', inset: 0, background: 'rgba(20, 40, 30, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px', animation: 'easyleanFade 0.25s ease-out' }}
            >
                <div
                    className="easyleanCelebration"
                    role="dialog"
                    aria-modal="true"
                    aria-label="הצלחה"
                    style={{
                        direction: 'rtl', background: 'white', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        width: 'min(560px, 100%)', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box',
                        padding: '28px 32px', textAlign: 'center', borderTop: '10px solid #4CAF50',
                        animation: 'easyleanPop 0.45s ease-out',
                    }}
                >
                    <div aria-hidden="true" style={{ fontSize: '64px', lineHeight: 1 }}>🎉</div>
                    <h2 style={{ margin: '12px 0 4px 0', fontSize: '40px', color: '#1e7e34' }}>הצלחה!</h2>
                    <p style={{ margin: '0 0 18px 0', fontSize: '20px', fontWeight: 'bold', color: '#333' }}>{message}</p>
                    {conclusion && (
                        <div style={{ textAlign: 'right', padding: '12px 14px', background: '#e6ffed', border: '1px solid #4CAF50', borderRadius: '8px', marginBottom: '20px' }}>
                            {renderMarkdownLite(conclusion)}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {onNext && (
                            <button
                                ref={nextRef}
                                onClick={onNext}
                                style={{ padding: '12px 28px', fontSize: '18px', fontWeight: 'bold', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                            >
                                {nextLabel}
                            </button>
                        )}
                        <button
                            data-celebration-close
                            onClick={onClose}
                            style={{ padding: '12px 20px', fontSize: '16px', background: 'white', color: '#333', border: '1px solid #999', borderRadius: '8px', cursor: 'pointer' }}
                        >
                            {onNext ? 'להישאר בשלב הזה' : 'סגירה'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SuccessCelebration;
