$(document).ready(function() {
    let scrollInterval;
    const scrollSpeed = 25; // Speed of scrolling (lower value = faster scroll)

    // Function to start scrolling based on mouse position
    function startScrolling(direction) {
        scrollInterval = setInterval(function() {
            const scrollTop = $('.info').scrollTop();
            if (direction === 'up') {
                $('.info').scrollTop(scrollTop - 1); // Scroll up
            } else if (direction === 'down') {
                $('.info').scrollTop(scrollTop + 1); // Scroll down
            }
        }, scrollSpeed);
    }

    // Function to stop scrolling
    function stopScrolling() {
        clearInterval(scrollInterval);
    }

    // Detect mouse movement within the scrollable area
    $('.info').mousemove(function(event) {
        const infoHeight = $(this).height();
        const offsetTop = $(this).offset().top;
        const mouseY = event.pageY - offsetTop; // Y position of the mouse relative to the .info container

        const upperBoundary = infoHeight * 0.3; // Upper 30% of the container
        const lowerBoundary = infoHeight * 0.7; // Lower 30% of the container

        if (mouseY < upperBoundary) {
            stopScrolling(); // Stop previous scroll
            startScrolling('up'); // Scroll up if mouse is in the upper 30% of the container
        } else if (mouseY > lowerBoundary) {
            stopScrolling(); // Stop previous scroll
            startScrolling('down'); // Scroll down if mouse is in the lower 30% of the container
        } else {
            stopScrolling(); // Stop scrolling if the mouse is in the middle
        }
    });

    // Stop scrolling when the mouse leaves the scrollable area
    $('.info').mouseleave(function() {
        stopScrolling();
    });

    // Stop scrolling when the user clicks inside the content
    $('.info').click(function() {
        stopScrolling();
    });
});