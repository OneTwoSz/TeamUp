
document.addEventListener("DOMContentLoaded", function() {
    var currentPage = document.body.getAttribute('data-page');
    var navbarItems = document.querySelectorAll('.vertical-navbar a');

    // Highlight index by default
    navbarItems[0].classList.add('active');

    if (currentPage === "tourguide") {
        navbarItems[1].classList.add('active');
    } else if (currentPage === "map") {
        navbarItems[1].classList.add('active');
        navbarItems[2].classList.add('active');
    } else if (currentPage === "event") {
        navbarItems[1].classList.add('active');
        navbarItems[2].classList.add('active');
        navbarItems[3].classList.add('active');
    }
});

// Identify the current page from the URL
const currentPage = window.location.pathname.split("/").pop();

// Loop through all navbar links
document.querySelectorAll(".nav-link").forEach(link => {
    // If the href of the link matches the current page, add the 'active' class
    if (link.getAttribute("href") === currentPage) {
        link.classList.add("active");
    } else {
        link.classList.remove("active");
    }
});

// This event listener waits for the DOM content to fully load before executing the provided functions.
document.addEventListener('DOMContentLoaded', (event) => {
    fetchAvailableSports();  // Fetch the available sports from the API and populate the dropdown
    initMap();  // Initialize the Google Map
});

function showResultsAndScroll() {
    document.getElementById('contentContainer').style.display = 'block';
    document.getElementById('resultsContainer').scrollIntoView({behavior: 'smooth'});
}


// This function fetches the available sports from the API and populates the dropdown.
function fetchAvailableSports() {
    const apiUrl = 'https://79uiw9r2be.execute-api.ap-southeast-2.amazonaws.com/stage/dbresource'; // API Endpoint

    fetch(apiUrl)
    .then(response => response.json())
    .then(sports => {
        const selectElement = document.getElementById('sportType');
        const addedSports = new Set();  // This set will help in tracking sports that have already been added to the dropdown
        
        // Clear any existing options in the dropdown
        selectElement.innerHTML = '<option value="all">Any</option>';
        
        // Iterate through the fetched sports data
        sports.forEach(sport => {
            const sportName = sport['Sports Played'];
            // Ensure that the sport type isn't already added to the dropdown
            if (!addedSports.has(sportName)) {
                const optionElement = document.createElement('option');
                optionElement.value = sportName;
                optionElement.textContent = sportName;
                selectElement.appendChild(optionElement);
                
                addedSports.add(sportName); // Add the sport type to the tracking set
            }
        });
    })
    .catch(error => {
        console.error('Error fetching available sports:', error);
    });
}

let map;
let currentInfoWindow = null;  // Used to track the currently opened info window on the map

// This function initializes the Google Map
function initMap() {
    const map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -37.8136, lng: 144.9631 }, // Default center coordinates
        zoom: 10,
    });

    return map;
}

// This event listener prevents the default form submission and fetches sports clubs based on the provided postal code and sport type.
document.querySelector('form').addEventListener('submit', function(e) {
    e.preventDefault(); 

    const postalCode = document.getElementById('postalCode').value;
    const sportType = document.getElementById('sportType').value;
    
    let apiUrl = `https://79uiw9r2be.execute-api.ap-southeast-2.amazonaws.com/stage/dbresource?postalCode=${postalCode}`;
    
    // Add sport type to the API URL if it's not 'all'
    if (sportType !== 'all') {
        apiUrl += `&sportType=${sportType}`;
    }

    fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
        const resultsList = document.getElementById('resultsList');
        resultsList.innerHTML = '';  // Clear any existing content
        
        // Display a message if no matching results were found
        if(data.length === 0) {
            const noResultsDiv = document.createElement('div');
            noResultsDiv.className = "alert alert-warning"; 
            noResultsDiv.textContent = "Sorry, no matching results were found.";
            resultsList.appendChild(noResultsDiv);
            return; 
        }
        
        const map = initMap();  // Reinitialize the map

        // This function will center the map on the provided location
        function centerMapOnLocation(latitude, longitude, zoomLevel =15) {
            const latLng = new google.maps.LatLng(latitude, longitude);
            map.setCenter(latLng);
            map.setZoom(zoomLevel)
        }

        // Store all markers and their associated info windows
        let markers = [];

        // Iterate through the fetched data and display each item on the map and in a card format
        data.forEach(item => {
            const cardDiv = document.createElement('div');
            cardDiv.className = "card mb-4 mx-auto"; 
            cardDiv.style.maxWidth = '600px';  

            const cardBody = document.createElement('div');
            cardBody.className = "card-body";

            const cardTitle = document.createElement('h5');
            cardTitle.className = "card-title";
            cardTitle.textContent = item['Facility Name'];
            cardBody.appendChild(cardTitle);

            const listGroup = document.createElement('ul');
            listGroup.className = "list-group list-group-flush";

            const details = [
                { label: "Sports Played", value: item['SportsPlayed'].split(',').join(', ') },
                { label: "Full Address", value: item['FullAddress'] },
                { label: "Postal Code", value: item['Pcode'] },
                { label: "Suburb/Town", value: item['Suburb/Town'] },
                // { label: "Latitude", value: item['Latitude'] },
                // { label: "Longitude", value: item['Longitude'] },
            ];
            // Create a card for each item in the data
            details.forEach(detail => {
                const li = document.createElement('li');
                li.className = "list-group-item";
                li.innerHTML = `<strong>${detail.label}:</strong> ${detail.value}`;
                listGroup.appendChild(li);
            });

            const navigateBtn = document.createElement('a'); 
            navigateBtn.className = "btn btn-primary mt-3 mr-3";  
            navigateBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${item['Latitude']},${item['Longitude']}`; 
            navigateBtn.target = "_blank";  
            navigateBtn.textContent = "Navigate with Google Maps";

            const centerButton = document.createElement('button');
            centerButton.className = "btn btn-secondary mt-3"; 
            centerButton.textContent = "View on Map";
            centerButton.addEventListener('click', function() {
                centerMapOnLocation(item['Latitude'], item['Longitude']);
                // Find the marker and trigger a click event on it
                const marker = markers.find(m => m.marker.position.lat() === parseFloat(item['Latitude']) && m.marker.position.lng() === parseFloat(item['Longitude']));
                if (marker) {
                    google.maps.event.trigger(marker.marker, 'click');
                }
            });

            cardBody.appendChild(centerButton);
            cardBody.appendChild(navigateBtn);  
            cardBody.appendChild(listGroup);
            cardDiv.appendChild(cardBody);
            resultsList.appendChild(cardDiv);
            // Mark each location on the Google Map
            const position = {
                lat: parseFloat(item['Latitude']),
                lng: parseFloat(item['Longitude'])
            };
            
            const marker = new google.maps.Marker({
                position,
                map,
                title: item['Facility Name']
            });

            const infoWindow = new google.maps.InfoWindow({
                // This content will be displayed when the marker is clicked
                content: `<strong>Facility Name:</strong> ${item['Facility Name']}<br>
                          <strong>Full Address:</strong> ${item['FullAddress']}<br>
                          <strong>Sports Played:</strong> ${item['SportsPlayed'].split(',').join(', ') }<br>`
            });

            // This event listener opens the info window when the marker is clicked
            marker.addListener('click', function() {
                // Close any previously opened info window
                if (currentInfoWindow) {
                    currentInfoWindow.close();
                }

                infoWindow.open(map, marker);
                currentInfoWindow = infoWindow;  // Update the tracking variable
            });
            markers.push({ marker: marker, infoWindow: infoWindow });
        });

        function centerMapOnLocation(latitude, longitude, zoomLevel = 15) {
            const latLng = new google.maps.LatLng(latitude, longitude);
            map.setCenter(latLng);
            map.setZoom(zoomLevel);
        }

        // Center the map on the first item in the fetched data
        if (data && data.length > 0) {
            const firstResult = data[0];
            const latLng = new google.maps.LatLng(firstResult['Latitude'], firstResult['Longitude']);
            map.setCenter(latLng);
        }

    })
    .catch(error => {
        console.error('Error fetching sports clubs:', error);
    });
});
