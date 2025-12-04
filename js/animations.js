/**
 * Portfolio Animation System
 * Modern micro-interactions and scroll reveals for Eliana Brereton Portfolio
 * @author Claude Code
 */

class PortfolioAnimations {
    constructor() {
        this.init();
    }

    init() {
        this.setupScrollReveal();
        this.setupButtonRipples();
        this.setupSmoothScroll();
        this.animateOnLoad();
    }

    /**
     * Intersection Observer for scroll-reveal animations
     * Watches for elements with .scroll-reveal class and triggers animation when they enter viewport
     */
    setupScrollReveal() {
        const revealElements = document.querySelectorAll('.scroll-reveal');

        if (revealElements.length === 0) return;

        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    // Optional: unobserve after reveal for better performance
                    // revealObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(el => {
            revealObserver.observe(el);
        });
    }

    /**
     * Material-design ripple effect for buttons
     * Creates a visual feedback ripple when buttons are clicked
     */
    setupButtonRipples() {
        const buttons = document.querySelectorAll('.btn');

        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                // Remove any existing ripples
                const existingRipple = this.querySelector('.ripple');
                if (existingRipple) {
                    existingRipple.remove();
                }

                const ripple = document.createElement('span');
                ripple.classList.add('ripple');
                ripple.style.cssText = `
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.6);
                    pointer-events: none;
                    animation: ripple-animation 0.6s ease-out;
                `;

                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';

                this.appendChild(ripple);

                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });

        // Add ripple animation keyframes if not already present
        if (!document.querySelector('#ripple-keyframes')) {
            const style = document.createElement('style');
            style.id = 'ripple-keyframes';
            style.textContent = `
                @keyframes ripple-animation {
                    from {
                        transform: scale(0);
                        opacity: 1;
                    }
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Smooth scrolling for anchor links
     * Enables smooth scroll behavior for internal page navigation
     */
    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href !== '#' && href !== '') {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        });
    }

    /**
     * Animate elements on initial page load
     * Creates staggered entrance animations for a polished first impression
     */
    animateOnLoad() {
        // Add fade-in to hero section
        const hero = document.querySelector('.hero');
        if (hero) {
            hero.classList.add('hero-entrance');
        }

        // Staggered card entrance (only for cards not already marked as scroll-reveal)
        const cards = document.querySelectorAll('.card:not(.scroll-reveal)');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('fade-in');
            }, index * 100);
        });

        // Pulse important CTAs after delay (desktop only)
        setTimeout(() => {
            const primaryCTA = document.querySelector('.hero .btn:first-of-type');
            if (primaryCTA && window.innerWidth > 768) {
                primaryCTA.classList.add('btn-pulse');
                // Remove pulse after 2 cycles (4 seconds)
                setTimeout(() => {
                    primaryCTA.classList.remove('btn-pulse');
                }, 4000);
            }
        }, 1000);
    }

    /**
     * Parallax scroll effect for hero image (subtle)
     * Creates depth with gentle parallax on scroll
     */
    setupParallax() {
        const heroImage = document.querySelector('.hero-image img');
        if (!heroImage) return;

        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrolled = window.pageYOffset;
                    const rate = scrolled * 0.3;
                    heroImage.style.transform = `translateY(${rate}px)`;
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    /**
     * Enhanced navbar behavior on scroll
     * Hides navbar when scrolling down, shows when scrolling up
     */
    setupNavbarScroll() {
        const nav = document.querySelector('.nav');
        if (!nav) return;

        let lastScroll = 0;
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const currentScroll = window.pageYOffset;

                    // Add scrolled class for styling
                    if (currentScroll > 100) {
                        nav.classList.add('scrolled');
                    } else {
                        nav.classList.remove('scrolled');
                    }

                    // Hide/show navbar based on scroll direction
                    if (currentScroll > lastScroll && currentScroll > 500) {
                        // Scrolling down & past threshold
                        nav.style.transform = 'translateY(-100%)';
                    } else {
                        // Scrolling up or at top
                        nav.style.transform = 'translateY(0)';
                    }

                    lastScroll = currentScroll;
                    ticking = false;
                });
                ticking = true;
            }
        });
    }
}

// Initialize animations when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PortfolioAnimations();
    });
} else {
    // DOM already loaded
    new PortfolioAnimations();
}

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PortfolioAnimations;
}
