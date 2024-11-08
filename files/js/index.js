// Clé API pour accéder aux cartes
const key = 'c7jzuBY8dijQYbCwt4AQ';

// Initialisation de la carte centrée sur les coordonnées données
const map = L.map('map').setView([50, 10], 4);

// Couleurs pour représenter les différents systèmes économiques
const economicSystemColors = {
    'Socialisme': '#ff7f0e',
    'Capitalisme': '#1f77b4',
    'Communisme': '#ee2425',
    'Fascisme': '#d62728',
    'Monarchie': '#310d94',
    'Dictature': '#FF6075',
    'Unknown': '#9467bd'
};

// Ajout d'une couche de carte personnalisée avec les tuiles MapTiler
L.tileLayer(`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${key}`, {
    tileSize: 512,
    zoomOffset: -1,
    minZoom: 5,
    maxZoom: 5,
    attribution: "Les données peuvent être fictives...",
    crossOrigin: true
}).addTo(map);
map.removeControl(map.zoomControl); // Suppression des contrôles de zoom

// Données économiques et couche GeoJSON pour les pays
let economicData = {}; // Stocke les données économiques pour chaque pays
let geojson;

// Liste des années disponibles pour les données économiques
const availableYears = [1900, 1925, 1950, 1970, 2024];

// Fonction pour trouver l'année disponible la plus proche
function getNearestYear(year) {
    return availableYears.reduce((prev, curr) => {
        return Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev;
    });
}

// Récupération des données économiques pour une année donnée
function fetchEconomicData(year) {
    const nearestYear = getNearestYear(year); // Cherche l'année la plus proche

    fetch(`files/json/${nearestYear}/data.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Aucune donnée éco-politique trouvée pour ${nearestYear}`);
            }
            return response.json();
        })
        .then(data => {
            economicData = data; // Met à jour les données économiques

            // Met à jour le style GeoJSON
            geojson.setStyle(getStyle);
            geojson.eachLayer(layer => {
                layer.unbindPopup();
                popup(layer.feature, layer); // Recharge les popups avec les nouvelles données
            });
        })
        .catch(error => console.error('Erreur lors de la récupération des données éco-politiques:', error));
}

// Fonction de style pour les couches GeoJSON
function getStyle(feature) {
    const countryName = feature.properties.NAME;
    const economicSystem = economicData[countryName] || 'Unknown';
    const color = economicSystemColors[economicSystem] || '#9467bd';

    return {
        weight: 0.4,
        opacity: 1,
        color: 'black',
        fillOpacity: 0.6,
        fillColor: color
    };
}

// Fonction pour créer un popup affichant les informations économiques
function popup(feature, layer) {
    const countryName = feature.properties.NAME;
    const economicSystem = economicData[countryName] || 'Unknown';
    layer.bindPopup(`<h3>${countryName}</h3><p>Système : ${economicSystem}</p>`);
}

// Chargement des données GeoJSON pour les pays européens et ajout à la carte
geojson = new L.GeoJSON.AJAX(`https://raw.githubusercontent.com/leakyMirror/map-of-europe/refs/heads/master/GeoJSON/europe.geojson`, {
    onEachFeature: function (feature, layer) {
        popup(feature, layer); // Ajoute un popup pour chaque pays
    },
    style: getStyle
}).addTo(map);

// Écouteur d'événement pour le chargement du document
document.addEventListener('DOMContentLoaded', () => {
    const yearSlider = document.getElementById('inputRangeYear');
    const yearDisplay = document.createElement('div');

    fetchEconomicData(2024); // Charge les données économiques initiales pour l'année 2024

    // Styles pour afficher l'année sélectionnée
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

    let targetValue = parseInt(yearSlider.value); // Valeur cible pour le slider
    let currentValue = targetValue; // Valeur actuelle affichée
    let finalValue = 0;

    const dampingFactor = 0.1; // Facteur d'amortissement pour la transition du slider

    // Fonction pour mettre à jour la position du slider de manière fluide
    function updateSlider() {
        currentValue += (targetValue - currentValue) * dampingFactor;

        finalValue = Math.round(Math.round(currentValue / 1) * 1);
        yearSlider.value = finalValue;
        yearDisplay.innerText = Math.round(yearSlider.value / 25) * 25; // Affiche l'année arrondie

        if (Math.abs(targetValue - currentValue) > 0.1) {
            requestAnimationFrame(updateSlider); // Continue la mise à jour si nécessaire
        }

        fetchEconomicData(yearDisplay.innerText); // Met à jour les données pour l'année affichée
    }

    // Écouteur d'événement pour la modification de la position du slider
    yearSlider.addEventListener('input', () => {
        targetValue = parseInt(yearSlider.value);
        yearDisplay.innerText = targetValue;
        if (Math.abs(targetValue - currentValue) > 0.1) {
            updateSlider();
        } else {
            currentValue = targetValue;
        }
    });

    // Écouteur d'événement pour la fin de la modification du slider
    yearSlider.addEventListener('change', () => {
        targetValue = parseInt(yearSlider.value);
        yearDisplay.innerText = targetValue;
        currentValue = targetValue;
    });
});
