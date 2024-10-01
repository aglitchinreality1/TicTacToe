let gen;

document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/gender')
      .then(response => response.json())
      .then(data => {
        gen = data.gender;
        const av = document.getElementById('avatar');
        if(gen === 'male'){
            av.src = 'images/male.jpg';
        }
        else if(gen === 'female'){
            av.src = 'images/female.jpg';
        }
        else if(gen === null){
            av.src = 'images/default.png';
        }
      })
      .catch(error => console.error('Error fetching constant:', error));
  });

function display_data(x) {
  document.addEventListener('DOMContentLoaded', () => {
      fetch(`/api/${x}`)
          .then(response => response.json())
          .then(data => {
              let val = data[x];
              if (val === null) {
                  val = "update";
              }
              const element = document.getElementById(x);
              if (element) {
                if (x === 'age') {
                    element.textContent = "AGE : " + val;
                  }
                else{
                    element.textContent = val;
                }
              } else {
                  console.error(`Element with id ${x} not found.`);
              }
          })
          .catch(error => console.error('Error fetching constant:', error));
  });
}

display_data('u_name');
display_data('age');
display_data('wins');
display_data('loses');
display_data('draws')



document.addEventListener('DOMContentLoaded', () => {
  fetch('/api/wins')
    .then(response => response.json())
    .then(data => {
      win = data.wins;
      const im = document.getElementById('level');
      if(win <= 10){
          im.src = 'images/bronze.jpg';
      }
      else if(win>10 && win<=20){
          im.src = 'images/silver.jpg';
      }
      else if(win>20 && win<=40){
          im.src = 'images/gold.png';
      }
      else if(win>40){
        im.src = 'images/diamond.png';
    }
    })
    .catch(error => console.error('Error fetching constant:', error));
});
