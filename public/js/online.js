function handleClickOnline() {
    const box = document.querySelector('.box');
    const newBox = document.querySelector('.createjoin');

    // Fade out the box
    box.style.opacity = "0";

    // Wait for the fade-out transition to complete, then hide the box and show the new box
    setTimeout(() => {
        box.style.display = "none"; // Hide the old box
        newBox.style.display = "flex"; // Make the new box visible

        // Fade in the new box
        setTimeout(() => {
            newBox.style.opacity = "1"; // Fade in the new box
        }, 100); // A small delay to allow for the display change before fade-in
    }, 1000); // Wait 1 second for the fade-out transition to finish
}





document.addEventListener('DOMContentLoaded', function () {
    const createButton = document.getElementById('c');
    const joinButton = document.getElementById('j');
    const createRoom = document.getElementById('create-room');
    const joinRoom = document.getElementById('join-room');

    createButton.addEventListener('click', function() {
        fadeOut(createButton);
        fadeOut(joinButton);
        setTimeout(() => {
            fadeIn(createRoom);
        }, 500);  // Wait for the fade-out to complete
    });

    joinButton.addEventListener('click', function() {
        fadeOut(createButton);
        fadeOut(joinButton);
        setTimeout(() => {
            fadeIn(joinRoom);
        }, 500);  // Wait for the fade-out to complete
    });

    function fadeOut(element) {
        element.style.opacity = '0';
        element.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            element.style.display = 'none';  // Hide after fading out
        }, 500);  // Match the fade-out duration
    }

    function fadeIn(element) {
        element.style.display = 'flex';  // Set display to flex for visibility
        setTimeout(() => {
            element.style.opacity = '1';  // Trigger fade-in
            element.style.visibility = 'visible';  // Ensure visibility
            element.style.transition = 'opacity 1s ease, visibility 1s ease';
        }, 10);  // Small delay to allow CSS transition to take effect
    }
});




function generateRoomCode() {
    const eventSource = new EventSource('/generate-room-code');
  
    eventSource.onmessage = function(event) {
      if (event.data === 'redirect') {
        // Redirect to the room endpoint
        const roomCode = document.getElementById('roomcode').textContent; // Get the room code from the displayed element
        window.location.href = `/${roomCode}`; // Redirect to the room code endpoint
      } else {
        // Update the room code display
        document.getElementById('roomcode').textContent = event.data;
      }
    };
  
    eventSource.onerror = function(event) {
      console.error('Error with SSE:', event);
      eventSource.close(); // Close the connection on error
    };
  }
  