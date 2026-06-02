document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        const images = card.querySelectorAll('.card-image');
        const defaultImage = images[0]; // The first image is the default image
        const dots = card.querySelectorAll('.dot');

        function updateActiveImage(index) {
            images.forEach((img, i) => {
                img.classList.toggle('active', i === (index + 1));
            });
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        }

        card.addEventListener('mousemove', (e) => {
            const cardWidth = card.clientWidth;
            const mouseX = e.offsetX;

            // Calculate which image to show based on the mouse position
            let index = Math.floor(mouseX / cardWidth * (dots.length));
            if (index >= dots.length) index = dots.length - 1;

            updateActiveImage(index);
        });

        card.addEventListener('mouseleave', () => {
            // Reset to default image when mouse leaves the card
            images.forEach((img, i) => {
                img.classList.toggle('active', i === 0);
            });
            dots.forEach(dot => dot.classList.remove('active'));
        });

        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                const index = parseInt(dot.getAttribute('data-index'));
                updateActiveImage(index);
            });
        });
    });
});

document.addEventListener("DOMContentLoaded", function() {
    function isMobileView() {
        return window.innerWidth <= 600;
    }

    function applyDesktopBehavior() {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.addEventListener('mouseover', function() {
                const images = card.querySelectorAll('img');
                images.forEach(img => img.classList.remove('active'));
                if (images.length > 0) {
                    images[0].classList.add('active');
                }
            });

            card.addEventListener('mouseout', function() {
                const images = card.querySelectorAll('img');
                images.forEach(img => img.classList.remove('active'));
                const defaultImage = card.querySelector('img');
                if (defaultImage) {
                    defaultImage.classList.add('active');
                }
            });
        });
    }

    function applyMobileBehavior() {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            let touchstartX = 0;
            let touchendX = 0;

            card.addEventListener('touchstart', function(event) {
                touchstartX = event.changedTouches[0].screenX;
            });

            card.addEventListener('touchend', function(event) {
                touchendX = event.changedTouches[0].screenX;
                handleSwipe(card);
            });

            function handleSwipe(card) {
                const images = card.querySelectorAll('img');
                const activeImage = Array.from(images).findIndex(img => img.classList.contains('active'));
                if (activeImage !== -1) {
                    images[activeImage].classList.remove('active');
                    if (touchendX < touchstartX) {
                        // Swiped left
                        images[(activeImage + 1) % images.length].classList.add('active');
                    } else if (touchendX > touchstartX) {
                        // Swiped right
                        images[(activeImage - 1 + images.length) % images.length].classList.add('active');
                    }
                    // Add glow effect
                    card.classList.add('glow');
                    setTimeout(() => {
                        card.classList.remove('glow');
                    }, 300); // Remove glow effect after 0.3s
                }
            }

            // Set the first image as active
            const images = card.querySelectorAll('img');
            if (images.length > 0) {
                images[0].classList.add('active');
            }
        });
    }

    function adjustBehavior() {
        if (isMobileView()) {
            applyMobileBehavior();
        } else {
            applyDesktopBehavior();
        }
    }

    window.addEventListener('resize', adjustBehavior);
    adjustBehavior(); // Initial call
});

