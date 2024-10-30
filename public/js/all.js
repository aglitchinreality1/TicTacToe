function redirectToPage(dest) {
    window.location.href = dest; 
}

// Function to handle displaying the player data in the fpop div
function displayPlayerData(data) {
    // Get the fpop div and make it visible
    const fpop = document.querySelector('.fpop');
    fpop.style.display = 'flex';
    const fimg = document.getElementById('fi');
    if(data.gender==='male'){
        fimg.src = 'images/male.jpg';
    }
    else if(data.gender==='female'){
        fimg.src = 'images/female.jpg';
    }
    else{
        fimg.src = 'images/default.png';
    }
    // Update player details
    document.querySelector('.ftext').textContent = `${data.name}`;
    document.querySelector('.info h3:nth-child(2)').textContent = `Age: ${data.age}`;
    document.querySelector('.info h3:nth-child(3)').textContent = `Gender: ${data.gender}`;

    // Update scores
    document.querySelector('.scores.w').textContent = data.wins;
    document.querySelector('.scores.l').textContent = data.loses;
    document.querySelector('.scores.d').textContent = data.draws;
}

// Add event listener to the close button to hide the fpop div
document.querySelector('.close').addEventListener('click', () => {
    document.querySelector('.fpop').style.display = 'none';
});

// Function to fetch player data based on email and display it
function searchPlayer(email) {
    fetch(`/search-player?email=${encodeURIComponent(email)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayPlayerData(data.player);
            } else {
                alert("Player not found.");
            }
        })
        .catch(error => console.error('Error:', error));
}

// Add event listener to the search form submission
document.querySelector('.sub').addEventListener('click', (event) => {
    event.preventDefault();
    const email = document.querySelector('input[type="search"]').value.trim();
    if (email) {
        searchPlayer(email);
    }
});
