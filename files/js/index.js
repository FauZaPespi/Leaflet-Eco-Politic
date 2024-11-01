
// Clé API pour accéder aux cartes
const key = 'c7jzuBY8dijQYbCwt4AQ';
// Initialisation de la carte avec une vue centrée
const map = L.map('map').setView([50, 10], 4);

// Couleurs des systèmes économiques
const economicSystemColors = {
    'Socialisme': '#ff7f0e',
    'Capitalisme': '#1f77b4',
    'Communisme': '#2ca02c',
    'Fascism': '#d62728',
    'Monarchie': '#310d94',
    'Dictature': '#FF6075',
    'Mixed Economy': '#9467bd' 
};

// Ajout de la carte custom
L.tileLayer(`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${key}`, {
    tileSize: 512,
    zoomOffset: -1,
    zoom: 5,
    minZoom: 5,
    maxZoom: 5,
    zoomControl: false,
    attribution: "<a href='https://www.maptiler.com/copyright/' target='_blank'>&copy; MapTiler</a> <a href='https://www.openstreetmap.org/copyright' target='_blank'>&copy; OpenStreetMap contributors</a> <a href='https://github.com/FauZaPespi/Leaflet-Eco-Politic'> the Github project link</a>",
    crossOrigin: true
}).addTo(map);
map.removeControl(map.zoomControl);


// Initialisation des données économiques
let economicData = {};
let geojson; 
let additionalGeoJSONLayer = null; 
// Années disponibles pour les données économiques
const availableYears = [1900, 1925, 1950, 1970, 2024]; 

// Fonction pour trouver l'année la plus proche
function getNearestYear(year) {
    let nearestYear = availableYears.reduce((prev, curr) => {
        return (Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev);
    });
    return nearestYear;
}

// Fonction pour récupérer les données économiques
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

            // Mise à jour du style de geojson
            geojson.setStyle(getStyle);
            geojson.eachLayer(layer => {
                layer.unbindPopup(); 
                popup(layer.feature, layer); 
            });

        })
        .catch(error => {
            console.error('Error fetching economic data:', error);
        });
}

// Fonction pour définir le style des couches
function getStyle(feature) {
    const countryName = feature.properties.text;
    const economicSystem = economicData[countryName] || 'Mixed Economy';
    const color = economicSystemColors[economicSystem] || '#9467bd'; 

    return {
        weight: 0.4,
        opacity: 1,
        color: 'black',
        fillOpacity: 0.6,
        fillColor: color
    };
}

// Fonction pour créer une popup avec les informations économiques
function popup(feature, layer) {
    const countryName = feature.properties.text;
    const economicSystem = economicData[countryName] || 'Mixed Economy'; 
    layer.bindPopup(`<h3>${countryName}</h3><p>Système économique : ${economicSystem}</p>`); 
}

// Chargement des données geojson et ajout à la carte
geojson = new L.GeoJSON.AJAX(`https://api.maptiler.com/data/13a81e89-4223-40dc-bcb9-407bf4cf1dd8/features.json?key=${key}`, {
    onEachFeature: function (feature, layer) {
        popup(feature, layer);
    },
    style: getStyle
}).addTo(map);

// Écouteur d'événements pour le chargement du document
document.addEventListener('DOMContentLoaded', () => {
    const yearSlider = document.getElementById('inputRangeYear');
    const yearDisplay = document.createElement('div');

    fetchEconomicData(2024); 

    // Styles pour l'affichage de l'année
    yearDisplay.style.position = 'absolute';
    yearDisplay.style.top = '107px';
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

    const dampingFactor = 0.1;

    // Fonction pour mettre à jour le slider
    function updateSlider() {
        currentValue += (targetValue - currentValue) * dampingFactor;

        finalValue = Math.round(Math.round(currentValue / 1) * 1);
        yearSlider.value = finalValue;
        yearDisplay.innerText = Math.round(yearSlider.value / 25) * 25;

        if (Math.abs(targetValue - currentValue) > 0.1) {
            requestAnimationFrame(updateSlider);
        }

        fetchEconomicData(yearDisplay.innerText);
    }

    // Écouteur d'événements pour le slider
    yearSlider.addEventListener('input', () => {
        targetValue = parseInt(yearSlider.value);
        yearDisplay.innerText = targetValue;
        if (Math.abs(targetValue - currentValue) > 0.1) {
            updateSlider();
        } else {
            currentValue = targetValue;
        }
    });

    // Écouteur d'événements pour la fin du changement du slider
    yearSlider.addEventListener('change', () => {
        targetValue = parseInt(yearSlider.value);
        yearDisplay.innerText = targetValue;
        currentValue = targetValue;
    });
});
