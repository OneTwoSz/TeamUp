async function fetchMatches() {
    let sport = document.getElementById('selectSport').value;
    let country = 'australia'; // Default country

    // If sport is tennis, adjust sport and country values
    if (sport.toLowerCase() === 'tennis') {
        sport = 'tennis';
        country = 'australian-open';
    }

    const timezone = '+11'; // Adjust this value according to your needs
    const url = `https://livescore6.p.rapidapi.com/matches/v2/list-by-league?Category=${sport}&Ccd=${country}&Timezone=${timezone}`;
    
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': '3d9929407fmshf8a3c65e55973b6p181882jsnc01dde46e49c',
            'X-RapidAPI-Host': 'livescore6.p.rapidapi.com'
        }
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        const result = await response.json();
        console.log(result);
        displayMatches(result);
    } catch (error) {
        console.error('Fetch error: ', error);
    }
}

function formatDate(dateNumber) {
    // Ensure dateNumber is a number
    if (typeof dateNumber !== 'number') {
        console.error('Invalid date number:', dateNumber);
        return 'Invalid date';
    }

    // Convert number to string and extract date components
    const dateString = String(dateNumber);
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6) - 1; // JavaScript months are zero-indexed
    const day = dateString.substring(6, 8);
    const hour = dateString.substring(8, 10);
    const minute = dateString.substring(10, 12);
    const second = dateString.substring(12, 14);
    
    // Creating a Date object
    const date = new Date(year, month, day, hour, minute, second);
    
    // Formatting the date into a readable string
    const dateFormatted = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    
    return dateFormatted;
}

function displayMatches(data) {
    const matchesDiv = document.getElementById('matchesInfo');
    matchesDiv.innerHTML = ''; 
    matchesDiv.className = 'container';  
    
    data.Stages.forEach(stage => {
        const stageElement = document.createElement('div');
        stageElement.className = 'mb-5'; 
        stageElement.innerHTML = `<h3 class="mt-4 mb-3">${stage.Snm}</h3>`;
        matchesDiv.appendChild(stageElement);

        const rowElement = document.createElement('div');
        rowElement.className = 'row';
        stageElement.appendChild(rowElement);

        stage.Events.forEach(event => {
            const team1 = event.T1[0].Nm; 
            const team2 = event.T2[0].Nm; 
            const dateRaw = event.Esd;  
            const dateFormatted = formatDate(dateRaw);  
            const scoreTeam1 = event.Tr1;  
            const scoreTeam2 = event.Tr2;  

            let scoreText = '';
            if (typeof scoreTeam1 !== 'undefined' && typeof scoreTeam2 !== 'undefined') {
                scoreText = `<p class="card-text">Score: ${scoreTeam1} - ${scoreTeam2}</p>`;
            }

            const colElement = document.createElement('div');
            colElement.className = 'col-lg-4 col-md-6 mb-4';
            colElement.innerHTML = `
                <div class="card shadow-sm h-100">
                    <div class="card-body">
                        <h5 class="card-title"><strong>${team1} vs ${team2}</strong></h5>
                        <p class="card-text">Date: ${dateFormatted}</p>
                        ${scoreText}
                    </div>
                </div>
            `;
            rowElement.appendChild(colElement);
        });
    });
}







