const key = 'c7jzuBY8dijQYbCwt4AQ';
const map = L.map('map').setView([50, 10], 4);

const economicSystemColors = {
    'Socialisme': '#ff7f0e',
    'Capitalisme': '#1f77b4',
    'Communisme': '#2ca02c',
    'Fascism': '#d62728',
    'Monarchie': '#310d94',
    'Dictature': '#FF6075',
    'Mixed Economy': '#9467bd' // Default color
};

L.tileLayer(`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${key}`, {
    tileSize: 512,
    zoomOffset: -1,
    minZoom: 5,
    attribution: "<a href='https://www.maptiler.com/copyright/' target='_blank'>&copy; MapTiler</a> <a href='https://www.openstreetmap.org/copyright' target='_blank'>&copy; OpenStreetMap contributors</a>",
    crossOrigin: true
}).addTo(map);

let economicData = {};
let geojson; // Declare geojson layer globally
let additionalGeoJSONLayer = null; // Store the additional GeoJSON layer

const availableYears = [1900, 1925, 1950, 1970, 2024]; // List of years with available data

// Function to find the nearest available year
function getNearestYear(year) {
    let nearestYear = availableYears.reduce((prev, curr) => {
        return (Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev);
    });
    return nearestYear;
}

// Function to fetch economic data based on the selected year
function fetchEconomicData(year) {
    const nearestYear = getNearestYear(year);
    if (year !== nearestYear) {
        year = nearestYear;
    }

    fetch(`files/json/${year}/data.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`No economic data found for ${year}`);
            }
            return response.json();
        })
        .then(data => {
            economicData = data;
            
            // Update styles for the main geojson layer
            geojson.setStyle(getStyle);
            geojson.eachLayer(layer => {
                layer.unbindPopup(); // Unbind existing popups
                popup(layer.feature, layer); // Rebind popups with updated data
            });
            
        })
        .catch(error => {
            console.error('Error fetching economic data:', error);
        });
}

// Function to style each country based on its economic data
function getStyle(feature) {
    const countryName = feature.properties.text;
    const economicSystem = economicData[countryName] || 'Mixed Economy'; // Get the system name
    const color = economicSystemColors[economicSystem] || '#9467bd'; // Get the corresponding color

    return {
        weight: 0.4,
        opacity: 1,
        color: 'black',
        fillOpacity: 0.6,
        fillColor: color
    };
}

// Function to create popups with economic system info
function popup(feature, layer) {
    const countryName = feature.properties.text;
    const economicSystem = economicData[countryName] || 'Mixed Economy'; // Get the system name

    layer.bindPopup(`<h3>${countryName}</h3><p>Economic System: ${economicSystem}</p>`); // Display the correct economic system
}

// Fetch and load GeoJSON data for the main dataset
geojson = new L.GeoJSON.AJAX(`https://api.maptiler.com/data/13a81e89-4223-40dc-bcb9-407bf4cf1dd8/features.json?key=${key}`, {
    onEachFeature: function (feature, layer) {
        popup(feature, layer);
    },
    style: getStyle
}).addTo(map);


// Initialize the slider and display year information
document.addEventListener('DOMContentLoaded', () => {
    const yearSlider = document.getElementById('inputRangeYear');
    const yearDisplay = document.createElement('div');

    fetchEconomicData(2024); // Initial load for 2024

    yearDisplay.style.position = 'absolute';
    yearDisplay.style.top = '60px';
    yearDisplay.style.left = '50%';
    yearDisplay.style.transform = 'translateX(-50%)';
    yearDisplay.style.fontSize = '18px';
    yearDisplay.style.fontWeight = 'bold';
    yearDisplay.style.zIndex = '1000';
    yearDisplay.classList.add("yearValue");
    yearDisplay.innerText = yearSlider.value;
    document.body.appendChild(yearDisplay);

    let targetValue = parseInt(yearSlider.value);
    let currentValue = targetValue;
    let finalValue = 0;

    // Damping factor for smooth slider movement
    const dampingFactor = 0.1;

    // Function to update the slider animation
    function updateSlider() {
        currentValue += (targetValue - currentValue) * dampingFactor;

        finalValue = Math.round(Math.round(currentValue / 1) * 1);
        yearSlider.value = finalValue;
        yearDisplay.innerText = Math.round(yearSlider.value / 25) * 25;

        if (Math.abs(targetValue - currentValue) > 0.1) {
            requestAnimationFrame(updateSlider);
        }

        // Fetch data based on the current year from the slider
        fetchEconomicData(yearDisplay.innerText);
    }

    // Event listener for input event to trigger slider update
    yearSlider.addEventListener('input', () => {
        targetValue = parseInt(yearSlider.value);
        yearDisplay.innerText = targetValue;
        if (Math.abs(targetValue - currentValue) > 0.1) {
            updateSlider();
        } else {
            currentValue = targetValue;
        }
    });

    // Event listener for change event when the slider stops
    yearSlider.addEventListener('change', () => {
        targetValue = parseInt(yearSlider.value);
        yearDisplay.innerText = targetValue;
        currentValue = targetValue;
    });
});
