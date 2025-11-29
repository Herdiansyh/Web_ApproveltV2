import React, { useEffect, useRef, useState } from 'react';

const TruckLoading = ({ show = false, text = 'Processing...', success = true }) => {
    const buttonRef = useRef(null);
    const animationRef = useRef(null);
    const startTimeRef = useRef(null);
    const progressIntervalRef = useRef(null);
    const [actualProgress, setActualProgress] = useState(0);

    useEffect(() => {
        if (!buttonRef.current) return;

        const button = buttonRef.current;
        
        if (show) {
            // Start animation
            if (!button.classList.contains('animation')) {
                button.classList.add('animation');
                startTimeRef.current = Date.now();
                setActualProgress(0);
                
                // Start progress animation that adapts to actual processing time
                progressIntervalRef.current = setInterval(() => {
                    const elapsed = Date.now() - startTimeRef.current;
                    // Simulate progress that speeds up or slows down based on elapsed time
                    // This creates a more natural progress feeling
                    let progress = 0;
                    
                    if (elapsed < 500) {
                        // Slow start (0-20% in first 500ms)
                        progress = (elapsed / 500) * 20;
                    } else if (elapsed < 2000) {
                        // Steady progress (20-80% from 500ms to 2s)
                        progress = 20 + ((elapsed - 500) / 1500) * 60;
                    } else {
                        // Slow down near completion (80-95% from 2s onwards)
                        progress = 80 + Math.min(((elapsed - 2000) / 3000) * 15, 15);
                    }
                    
                    setActualProgress(Math.min(progress, 95)); // Cap at 95% until completion
                }, 50);
                
                // Animation timeline using GSAP if available, otherwise CSS
                if (window.gsap) {
                    const box = button.querySelector('.box');
                    const truck = button.querySelector('.truck');
                    
                    window.gsap.to(button, {
                        '--box-s': 1,
                        '--box-o': 1,
                        duration: 0.3,
                        delay: 0.5
                    });

                    window.gsap.to(box, {
                        x: 0,
                        duration: 0.4,
                        delay: 0.7
                    });

                    window.gsap.to(button, {
                        '--hx': -5,
                        '--bx': 50,
                        duration: 0.18,
                        delay: 0.92
                    });

                    window.gsap.to(box, {
                        y: 0,
                        duration: 0.1,
                        delay: 1.15
                    });

                    window.gsap.set(button, {
                        '--truck-y': 0,
                        '--truck-y-n': -26
                    });

                    window.gsap.to(button, {
                        '--truck-y': 1,
                        '--truck-y-n': -25,
                        duration: 0.2,
                        delay: 1.25,
                        onComplete() {
                            // Start truck movement animation that loops until completion
                            const truckAnimation = window.gsap.timeline({ repeat: -1 });
                            truckAnimation.to(truck, {
                                x: 0,
                                duration: 0.4
                            }).to(truck, {
                                x: 40,
                                duration: 1
                            }).to(truck, {
                                x: 20,
                                duration: 0.6
                            }).to(truck, {
                                x: 96,
                                duration: 0.4
                            });
                            
                            animationRef.current = truckAnimation;
                        }
                    });
                }
            }
        } else {
            // Complete animation
            const truck = button.querySelector('.truck');
            const box = button.querySelector('.box');
            const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
            
            // Clear progress interval
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
            }
            
            // Set final progress to 100%
            setActualProgress(100);
            
            // Complete the animation based on success/failure
            if (window.gsap && truck && box) {
                // Stop looping truck animation
                if (animationRef.current) {
                    animationRef.current.kill();
                    animationRef.current = null;
                }
                
                if (success) {
                    // Success animation - truck completes journey
                    window.gsap.to(truck, {
                        x: 120,
                        duration: 0.8,
                        ease: "power2.out"
                    });
                    
                    window.gsap.to(button, {
                        '--progress': 1,
                        duration: 0.8,
                        ease: "power2.out"
                    });
                    
                    // Show success state
                    setTimeout(() => {
                        button.classList.add('done');
                    }, 400);
                } else {
                    // Failure animation - truck stops and reverses
                    window.gsap.to(truck, {
                        x: -20,
                        duration: 0.6,
                        ease: "power2.in"
                    });
                    
                    window.gsap.to(button, {
                        '--progress': 0.3,
                        duration: 0.6,
                        ease: "power2.in"
                    });
                    
                    // Shake effect for failure
                    window.gsap.to(button, {
                        x: -5,
                        duration: 0.1,
                        repeat: 3,
                        yoyo: true,
                        ease: "power2.inOut"
                    });
                }
            }
        }
    }, [show, success]);

    // Cleanup effect
    useEffect(() => {
        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
            if (animationRef.current) {
                animationRef.current.kill();
            }
        };
    }, []);

    if (!show) return null;

    return (
        <>
            <style jsx>{`
                .truck-button {
                    --color: #fff;
                    --background: #2B3044;
                    --tick: #16BF78;
                    --base: #0D0F18;
                    --wheel: #2B3044;
                    --wheel-inner: #646B8C;
                    --wheel-dot: #fff;
                    --back: #6D58FF;
                    --back-inner: #362A89;
                    --back-inner-shadow: #2D246B;
                    --front: #A6ACCD;
                    --front-shadow: #535A79;
                    --front-light: #FFF8B1;
                    --window: #2B3044;
                    --window-shadow: #404660;
                    --street: #646B8C;
                    --street-fill: #404660;
                    --box: #DCB97A;
                    --box-shadow: #B89B66;
                    padding: 12px 0;
                    width: 172px;
                    cursor: pointer;
                    text-align: center;
                    position: relative;
                    border: none;
                    outline: none;
                    color: var(--color);
                    background: var(--background);
                    border-radius: var(--br, 15px);
                    -webkit-appearance: none;
                    -webkit-tap-highlight-color: transparent;
                    transform-style: preserve-3d;
                    transform: rotateX(var(--rx, 0deg)) translateZ(0);
                    transition: transform 0.5s, border-radius 0.3s linear var(--br-d, 0s);
                }
                
                .truck-button:before, .truck-button:after {
                    content: "";
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 6px;
                    display: block;
                    background: var(--b, var(--street));
                    transform-origin: 0 100%;
                    transform: rotateX(90deg) scaleX(var(--sy, 1));
                }
                
                .truck-button:after {
                    --sy: var(--progress, 0);
                    --b: var(--street-fill);
                }
                
                .truck-button.success-state {
                    --background: #16BF78;
                }
                
                .truck-button.error-state {
                    --background: #E74C3C;
                }
                
                .truck-button .default,
                .truck-button .success {
                    display: block;
                    font-weight: 500;
                    font-size: 14px;
                    line-height: 24px;
                    opacity: var(--o, 1);
                    transition: opacity 0.3s;
                }
                
                .truck-button .success {
                    --o: 0;
                    position: absolute;
                    top: 12px;
                    left: 0;
                    right: 0;
                }
                
                .truck-button .success svg {
                    width: 12px;
                    height: 10px;
                    display: inline-block;
                    vertical-align: top;
                    fill: none;
                    margin: 7px 0 0 12px;
                    stroke: var(--tick);
                    stroke-width: 2;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                    stroke-dasharray: 16px;
                    stroke-dashoffset: var(--offset, 16px);
                    transition: stroke-dashoffset 0.4s ease 0.45s;
                }
                
                .truck-button .truck {
                    position: absolute;
                    width: 72px;
                    height: 28px;
                    transform: rotateX(90deg) translate3d(var(--truck-x, 4px), calc(var(--truck-y-n, -26) * 1px), 12px);
                }
                
                .truck-button .truck:before, .truck-button .truck:after {
                    content: "";
                    position: absolute;
                    bottom: -6px;
                    left: var(--l, 18px);
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    z-index: 2;
                    box-shadow: inset 0 0 0 2px var(--wheel), inset 0 0 0 4px var(--wheel-inner);
                    background: var(--wheel-dot);
                    transform: translateY(calc(var(--truck-y) * -1px)) translateZ(0);
                }
                
                .truck-button .truck:after {
                    --l: 54px;
                }
                
                .truck-button .truck .wheel,
                .truck-button .truck .wheel:before {
                    position: absolute;
                    bottom: var(--b, -6px);
                    left: var(--l, 6px);
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: var(--wheel);
                    transform: translateZ(0);
                }
                
                .truck-button .truck .wheel {
                    transform: translateY(calc(var(--truck-y) * -1px)) translateZ(0);
                }
                
                .truck-button .truck .wheel:before {
                    --l: 35px;
                    --b: 0;
                    content: "";
                }
                
                .truck-button .truck .front,
                .truck-button .truck .back,
                .truck-button .truck .box {
                    position: absolute;
                }
                
                .truck-button .truck .back {
                    left: 0;
                    bottom: 0;
                    z-index: 1;
                    width: 47px;
                    height: 28px;
                    border-radius: 1px 1px 0 0;
                    background: linear-gradient(68deg, var(--back-inner) 0%, var(--back-inner) 22%, var(--back-inner-shadow) 22.1%, var(--back-inner-shadow) 100%);
                }
                
                .truck-button .truck .back:before, .truck-button .truck .back:after {
                    content: "";
                    position: absolute;
                }
                
                .truck-button .truck .back:before {
                    left: 11px;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 2;
                    border-radius: 0 1px 0 0;
                    background: var(--back);
                }
                
                .truck-button .truck .back:after {
                    border-radius: 1px;
                    width: 73px;
                    height: 2px;
                    left: -1px;
                    bottom: -2px;
                    background: var(--base);
                }
                
                .truck-button .truck .front {
                    left: 47px;
                    bottom: -1px;
                    height: 22px;
                    width: 24px;
                    -webkit-clip-path: polygon(55% 0, 72% 44%, 100% 58%, 100% 100%, 0 100%, 0 0);
                    clip-path: polygon(55% 0, 72% 44%, 100% 58%, 100% 100%, 0 100%, 0 0);
                    background: linear-gradient(84deg, var(--front-shadow) 0%, var(--front-shadow) 10%, var(--front) 12%, var(--front) 100%);
                }
                
                .truck-button .truck .front:before, .truck-button .truck .front:after {
                    content: "";
                    position: absolute;
                }
                
                .truck-button .truck .front:before {
                    width: 7px;
                    height: 8px;
                    background: #fff;
                    left: 7px;
                    top: 2px;
                    -webkit-clip-path: polygon(0 0, 60% 0%, 100% 100%, 0% 100%);
                    clip-path: polygon(0 0, 60% 0%, 100% 100%, 0% 100%);
                    background: linear-gradient(59deg, var(--window) 0%, var(--window) 57%, var(--window-shadow) 55%, var(--window-shadow) 100%);
                }
                
                .truck-button .truck .front:after {
                    width: 3px;
                    height: 2px;
                    right: 0;
                    bottom: 3px;
                    background: var(--front-light);
                }
                
                .truck-button .truck .box {
                    width: 13px;
                    height: 13px;
                    right: 56px;
                    bottom: 0;
                    z-index: 1;
                    border-radius: 1px;
                    overflow: hidden;
                    transform: translate(calc(var(--box-x, -24) * 1px), calc(var(--box-y, -6) * 1px)) scale(var(--box-s, 0.5));
                    opacity: var(--box-o, 0);
                    background: linear-gradient(68deg, var(--box) 0%, var(--box) 50%, var(--box-shadow) 50.2%, var(--box-shadow) 100%);
                    background-size: 250% 100%;
                    background-position-x: calc(var(--bx, 0) * 1%);
                }
                
                .truck-button .truck .box:before, .truck-button .truck .box:after {
                    content: "";
                    position: absolute;
                }
                
                .truck-button .truck .box:before {
                    content: "";
                    background: rgba(255, 255, 255, 0.2);
                    left: 0;
                    right: 0;
                    top: 6px;
                    height: 1px;
                }
                
                .truck-button .truck .box:after {
                    width: 6px;
                    left: 100%;
                    top: 0;
                    bottom: 0;
                    background: var(--back);
                    transform: translateX(calc(var(--hx, 0) * 1px));
                }
                
                .truck-button.animation {
                    --rx: -90deg;
                    --br: 0;
                }
                
                .truck-button.animation .default {
                    --o: 0;
                }
                
                .truck-button.animation.done {
                    --rx: 0deg;
                    --br: 15px;
                    --br-d: .2s;
                }
                
                .truck-button.animation.done .success {
                    --o: 1;
                    --offset: 0;
                }
                
                .loading-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                    backdrop-filter: blur(2px);
                }
                
                .loading-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 20px;
                }
                
                .loading-text {
                    color: white;
                    font-size: 16px;
                    font-weight: 500;
                }
            `}</style>
            
            <div className="loading-overlay">
                <div className="loading-content">
                    <button 
                        className={`truck-button ${!show && success ? 'success-state' : ''} ${!show && !success ? 'error-state' : ''}`} 
                        ref={buttonRef}
                        style={{
                            '--progress': actualProgress / 100
                        }}
                    >
                        <span className="default">{text}</span>
                        <span className="success">
                            {success ? 'Complete' : 'Failed'}
                            {success ? (
                                <svg viewBox="0 0 12 10">
                                    <polyline points="1.5 6 4.5 9 10.5 1"></polyline>
                                </svg>
                            ) : (
                                <svg viewBox="0 0 12 12" style={{ width: '12px', height: '12px', margin: '7px 0 0 12px' }}>
                                    <line x1="3" y1="3" x2="9" y2="9" stroke="#fff" strokeWidth="2"/>
                                    <line x1="9" y1="3" x2="3" y2="9" stroke="#fff" strokeWidth="2"/>
                                </svg>
                            )}
                        </span>
                        <div className="truck">
                            <div className="wheel"></div>
                            <div className="back"></div>
                            <div className="front"></div>
                            <div className="box"></div>
                        </div>
                    </button>
                    <div className="loading-text">{text}</div>
                    <div className="loading-progress" style={{ color: 'white', fontSize: '12px', marginTop: '10px' }}>
                        {Math.round(actualProgress)}%
                    </div>
                </div>
            </div>
        </>
    );
};

export default TruckLoading;
