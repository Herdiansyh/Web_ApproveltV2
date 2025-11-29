import React, { useEffect, useRef, useState } from 'react';

const DownloadLoading = ({ show = false, onComplete = null }) => {
    const buttonRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        if (!buttonRef.current || !window.gsap) return;

        const button = buttonRef.current;
        
        if (show) {
            // Kill any existing animation first
            if (animationRef.current) {
                animationRef.current.kill();
            }
            
            // Reset all states
            button.classList.remove('active');
            button.classList.add('active');
            
            // Reset all CSS variables
            window.gsap.set(button, {
                '--svg-y': '0px',
                '--arrow-x': '0px',
                '--arrow-y': '2px',
                '--arrow-r': '0deg',
                '--line-opacity': '0',
                '--circle-opacity': '1',
                '--parachute-o': '1',
                '--parachute-y': '0px',
                '--parachute-s': '0',
                '--line-progress-o': '0',
                '--line-progress': '260px',
                '--success-y': '12px',
                '--success-o': '0',
                '--number-y': '12px',
                '--number-o': '0'
            });

            // Small delay to ensure DOM is ready
            setTimeout(() => {
                let circle = button.querySelector('.circle path'),
                    arrow = button.querySelector('.arrow path'),
                    line = new Proxy({
                        y: null
                    }, {
                        set(target, key, value) {
                            target[key] = value;
                            if(target.y !== null) {
                                const lineElement = button.querySelector('.line');
                                if (lineElement) {
                                    lineElement.innerHTML = getPath(target.y, .2);
                                }
                            }
                            return true;
                        },
                        get(target, key) {
                            return target[key];
                        }
                    }),
                    number = button.querySelector('.number span'),
                    count = { number: 0 };
                line.y = 64.5;

                // Reset number to 0
                if (number) {
                    number.innerHTML = '0';
                }

                const timeline = window.gsap.timeline();
                
                // Simplified animation without MorphSVGPlugin
                timeline.to(circle, {
                    opacity: 0,
                    duration: .15,
                    onComplete() {
                        window.gsap.set(button, {
                            '--circle-opacity': 0,
                            '--line-opacity': 1
                        });
                    }
                }).to(button, {
                    '--svg-y': '120px',
                    '--arrow-y': '44px',
                    duration: .15
                }, 0).to(button, {
                    '--arrow-y': '-72px',
                    duration: .3,
                    ease: 'power1.out'
                }).to(button, {
                    '--arrow-y': '40px',
                    '--line-progress': '0px',
                    duration: 3,
                    delay: .15,
                    onStart() {
                        window.gsap.to(button, {
                            '--line-progress-o': 1
                        });
                    }
                }).to(count, {
                    number: 100,
                    roundProps: 'number',
                    duration: 3,
                    onUpdate: () => {
                        if (number) number.innerHTML = count.number;
                    }
                }, .6).to(button, {
                    '--parachute-o': 0,
                    '--parachute-y': '12px',
                    duration: .2
                }).to(button, {
                    '--arrow-y': '20px',
                    duration: .7,
                    ease: 'elastic.out(1, .8)'
                });

                window.gsap.to(button, {
                    '--parachute-s': 1,
                    '--number-o': 1,
                    '--number-y': '0px',
                    duration: .2,
                    delay: .4
                });

                window.gsap.to(button, {
                    ease: 'linear',
                    keyframes: [{
                        '--arrow-r': '190deg',
                        '--arrow-x': '-12px',
                        duration: .6,
                        delay: .6
                    }, {
                        '--arrow-r': '170deg',
                        '--arrow-x': '12px',
                        duration: .6
                    }, {
                        '--arrow-r': '185deg',
                        '--arrow-x': '-6px',
                        duration: .7
                    }, {
                        '--arrow-r': '180deg',
                        '--arrow-x': '0px',
                        duration: .5
                    }]
                });

                window.gsap.to(button, {
                    '--arrow-r': '180deg',
                    duration: .3
                });

                window.gsap.to(line, {
                    keyframes: [{
                        y: 24,
                        duration: .15,
                        delay: .125
                    }, {
                        y: 64.5,
                        duration: .8,
                        ease: 'elastic.out(1, .5)'
                    }]
                });

                window.gsap.to(button, {
                    '--success-o': 1,
                    '--success-y': '0px',
                    duration: .25,
                    delay: 3.825,
                    onComplete() {
                        // Animation completed, trigger the callback
                        setTimeout(() => {
                            if (onComplete) {
                                onComplete();
                            }
                        }, 200); // Small delay to show success state
                    }
                });

                // Remove morphSVG animation for arrow
                window.gsap.to(arrow, {
                    rotation: 360,
                    duration: .2,
                    delay: 3.8
                });

                animationRef.current = timeline;
            }, 100);

        } else {
            // Reset animation
            if (animationRef.current) {
                animationRef.current.kill();
                animationRef.current = null;
            }
            button.classList.remove('active');
            
            // Reset all CSS variables
            window.gsap.set(button, {
                '--svg-y': '0px',
                '--arrow-x': '0px',
                '--arrow-y': '2px',
                '--arrow-r': '0deg',
                '--line-opacity': '0',
                '--circle-opacity': '1',
                '--parachute-o': '1',
                '--parachute-y': '0px',
                '--parachute-s': '0',
                '--line-progress-o': '0',
                '--line-progress': '260px',
                '--success-y': '12px',
                '--success-o': '0',
                '--number-y': '12px',
                '--number-o': '0'
            });

            // Reset arrow rotation
            const arrow = button.querySelector('.arrow path');
            if (arrow) {
                window.gsap.set(arrow, {
                    rotation: 0
                });
            }

            // Reset circle opacity
            const circle = button.querySelector('.circle path');
            if (circle) {
                window.gsap.set(circle, {
                    opacity: 1
                });
            }

            // Reset number to 0
            const number = button.querySelector('.number span');
            if (number) {
                number.innerHTML = '0';
            }
        }
    }, [show, onComplete]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                animationRef.current.kill();
            }
        };
    }, []);

    if (!show) return null;

    return (
        <>
            <style jsx>{`
                .download-overlay {
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
                
                .download-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 20px;
                }
                
                .dl-parachute {
                    --color-text: #275EFE;
                    --color-icon: #275EFE;
                    --color-line: #275EFE;
                    --svg-y: 0px;
                    --arrow-x: 0px;
                    --arrow-y: 2px;
                    --arrow-r: 0deg;
                    --line-opacity: 0;
                    --circle-opacity: 1;
                    --parachute-o: 1;
                    --parachute-y: 0px;
                    --parachute-s: 0;
                    --line-progress-o: 0;
                    --line-progress: 260px;
                    --success-y: 12px;
                    --success-o: 0;
                    --number-y: 12px;
                    --number-o: 0;
                    -webkit-tap-highlight-color: transparent;
                    -webkit-appearance: none;
                    outline: none;
                    background: none;
                    border: none;
                    padding: 0;
                    margin: 0;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    font-family: "Inter";
                    position: relative;
                    width: 120px;
                    height: 120px;
                }
                
                .dl-parachute svg {
                    display: block;
                    pointer-events: none;
                }
                
                .dl-parachute svg.circle, .dl-parachute svg.line {
                    width: 280px;
                    height: 124px;
                    position: absolute;
                    left: -80px;
                    stroke-width: 3px;
                    stroke-linecap: round;
                    stroke: var(--color-line);
                    fill: none;
                }
                
                .dl-parachute svg.circle {
                    top: -2px;
                    opacity: var(--circle-opacity);
                    transform: translateY(var(--svg-y)) rotate(180deg);
                }
                
                .dl-parachute svg.line {
                    height: 128px;
                    bottom: -65px;
                    opacity: var(--line-opacity);
                }
                
                .dl-parachute svg.line .progress {
                    stroke-width: 6px;
                    stroke-dasharray: 260px;
                    opacity: var(--line-progress-o);
                    stroke-dashoffset: var(--line-progress);
                }
                
                .dl-parachute .arrow {
                    position: absolute;
                    left: 36px;
                    top: 36px;
                    transform: translate(var(--arrow-x), var(--arrow-y)) rotate(var(--arrow-r));
                }
                
                .dl-parachute .arrow .base {
                    fill: var(--color-icon);
                    width: 48px;
                    height: 48px;
                }
                
                .dl-parachute .arrow .parachute {
                    position: absolute;
                    width: 28px;
                    height: 32px;
                    fill: var(--color-icon);
                    left: 10px;
                    bottom: -26px;
                    transform-origin: 50% 0%;
                    opacity: var(--parachute-o);
                    transform: translateY(var(--parachute-y)) scale(var(--parachute-s));
                }
                
                .dl-parachute .number,
                .dl-parachute .success {
                    position: absolute;
                    left: 0;
                    right: 0;
                    top: var(--t, 160px);
                    text-align: center;
                    color: #ffffff;
                    opacity: var(--o, var(--number-o));
                    transform: translateY(var(--y, var(--number-y)));
                    font-weight: 600;
                    font-size: 14px;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                }
                
                .dl-parachute .success {
                    --t: 12px;
                    --o: var(--success-o);
                    --y: var(--success-y);
                }
                
                .download-text {
                    color: white;
                    font-size: 16px;
                    font-weight: 500;
                    margin-top: 140px;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                }
            `}</style>
            
            <div className="download-overlay">
                <div className="download-content">
                    <button className="dl-parachute" ref={buttonRef}>
                        <span className="success">Complete</span>
                        <div className="arrow">
                            <svg className="base" viewBox="0 0 48 48">
                                <path d="M23.191 46.588C23.379 46.847 23.68 47 24 47C24.32 47 24.621 46.847 24.809 46.588L40.809 24.588C41.03 24.284 41.062 23.881 40.892 23.546C40.72 23.211 40.376 23 40 23H31V2C31 1.448 30.552 1 30 1H18C17.448 1 17 1.448 17 2V23H7.99999C7.62399 23 7.27999 23.211 7.10899 23.546C6.93799 23.881 6.96999 24.284 7.19199 24.588L23.191 46.588Z" />
                            </svg>
                            <svg className="parachute" viewBox="0 0 28 32">
                                <path d="M27.5 20.2542C26.9093 23.9345 24.4253 32 14 32C3.57466 32 1.09075 23.9345 0.5 20.2542L0.502764 19.04L12.756 0H15.244L27.4972 19.04C27.4972 19.4629 27.5 20.2542 27.5 20.2542ZM25.8243 19.0357L14.933 3.0248V18.5033C15.9843 18.5979 16.8727 18.8393 17.7587 19.0801C18.887 19.3867 20.0115 19.6923 21.4639 19.6923C22.9864 19.6923 24.6154 19.3565 25.8243 19.0357ZM13.067 18.5033V3.0248L2.17572 19.0357C3.38456 19.3565 5.01356 19.6923 6.5361 19.6923C7.98852 19.6923 9.113 19.3867 10.2413 19.0801C11.1273 18.8393 12.0157 18.5979 13.067 18.5033Z" />
                            </svg>
                        </div>
                        <svg className="circle" viewBox="0 0 280 124">
                            <path d="M81.5 62C81.5006 29.6913 107.691 3.50059 140 3.5C172 3.5 198.505 30.1029 198.5 62C198.495 94.1709 172.67 120.225 140.5 120.5C108.054 120.777 81.4994 94.447 81.5 62Z" />
                        </svg>
                        <svg className="line" viewBox="0 0 280 128"></svg>
                        <span className="number"><span>0</span>%</span>
                    </button>
                    <div className="download-text">Mengunduh dokumen...</div>
                </div>
            </div>
        </>
    );
};

// Helper functions from the original script
function getPoint(point, i, a, smoothing) {
    let cp = (current, previous, next, reverse) => {
            let p = previous || current,
                n = next || current,
                o = {
                    length: Math.sqrt(Math.pow(n[0] - p[0], 2) + Math.pow(n[1] - p[1], 2)),
                    angle: Math.atan2(n[1] - p[1], n[0] - p[0])
                },
                angle = o.angle + (reverse ? Math.PI : 0),
                length = o.length * smoothing;
            return [current[0] + Math.cos(angle) * length, current[1] + Math.sin(angle) * length];
        },
        cps = cp(a[i - 1], a[i - 2], point, false),
        cpe = cp(point, a[i - 1], a[i + 1], true);
    return `C ${cps[0]},${cps[1]} ${cpe[0]},${cpe[1]} ${point[0]},${point[1]}`;
}

function getPath(update, smoothing) {
    let points = [
            [10, 64.5],
            [140, update],
            [270, 64.5]
        ],
        d = points.reduce((acc, point, i, a) => i === 0 ? `M ${point[0]},${point[1]}` : `${acc} ${getPoint(point, i, a, smoothing)}`, '');
    return `<path d="${d}" /><path class="progress" d="${d}" />`;
}

export default DownloadLoading;
