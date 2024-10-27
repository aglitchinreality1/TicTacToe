let gen;

// Retrieve user data and update the UI
document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/user')
        .then(response => response.json())
        .then(data => {
            if (data) {
                gen = data.gender;
                updateAvatar(gen);
                displayData('u_name', data.name);
                displayData('age', data.age);
                displayData('wins', data.wins);
                displayData('loses', data.loses);
                displayData('draws', data.draws);
                updateLevel(data.wins);
            }
        })
        .catch(error => console.error('Error fetching user data:', error));
});

function updateAvatar(gender) {
    const av = document.getElementById('avatar');
    if (gender === 'male') {
        av.src = 'images/male.jpg';
    } else if (gender === 'female') {
        av.src = 'images/female.jpg';
    } else {
        av.src = 'images/default.png';
    }
}

function displayData(id, value) {
    const element = document.getElementById(id);
    if (element) {
        if (id === 'age') {
            element.textContent = `AGE : ${value || 'update'}`;
        } else {
            element.textContent = value;
        }
    } else {
        console.error(`Element with id ${id} not found.`);
    }
}

function updateLevel(wins) {
    const im = document.getElementById('level');
    if (wins <= 10) {
        im.src = 'images/bronze.jpg';
    } else if (wins > 10 && wins <= 20) {
        im.src = 'images/silver.jpg';
    } else if (wins > 20 && wins <= 40) {
        im.src = 'images/gold.jpg';
    } else if (wins > 40) {
        im.src = 'images/diamond.jpg';
    }
}
