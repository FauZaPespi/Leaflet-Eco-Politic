const key = 'c7jzuBY8dijQYbCwt4AQ';
const map = L.map('map').setView([50, 10], 4); 

L.tileLayer(`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${key}`, {
    tileSize: 512,
    zoomOffset: -1,
    minZoom: 1,
    attribution: "\u003ca href=\"https://www.maptiler.com/copyright/\" target=\"_blank\"\u003e\u0026copy; MapTiler\u003c/a\u003e \u003ca href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\"\u003e\u0026copy; OpenStreetMap contributors\u003c/a\u003e",
    crossOrigin: true
}).addTo(map);

let economicData = {};

fetch('files/json/2024/data.json')
    .then(response => response.json())
    .then(data => {
        economicData = data;
    })
    .catch(error => console.error('Error loading economic data:', error));

function getStyle(feature) {
    const countryName = feature.properties.text;
    const economicInfo = economicData[countryName] || { system: 'Mixed Economy', color: '#9467bd' };

    return {
        weight: 1,
        opacity: 1,
        color: 'black',
        fillOpacity: 1,
        fillColor: economicInfo.color
    };
}

function popup(feature, layer) {
    const countryName = feature.properties.text;
    const economicInfo = economicData[countryName] || { system: 'Mixed Economy' };
    layer.bindPopup(`<h3>${countryName}</h3><p>Economic System: ${economicInfo.system}</p>`);
}

const geojson = new L.GeoJSON.AJAX(`https://api.maptiler.com/data/13a81e89-4223-40dc-bcb9-407bf4cf1dd8/features.json?key=${key}`, {
    onEachFeature: function (feature, layer) {
        popup(feature, layer);
    },
    style: getStyle
}).addTo(map);
document.addEventListener('DOMContentLoaded', () => {
    const yearSlider = document.getElementById('inputRangeYear');
    const yearDisplay = document.createElement('div');

    yearDisplay.style.position = 'absolute';
    yearDisplay.style.top = '60px';
    yearDisplay.style.left = '50%';
    yearDisplay.style.transform = 'translateX(-50%)';
    yearDisplay.style.fontSize = '18px';
    yearDisplay.style.fontWeight = 'bold';
    yearDisplay.style.zIndex = '1000';
    yearDisplay.innerText = yearSlider.value;
    document.body.appendChild(yearDisplay);

    let targetValue = parseInt(yearSlider.value);
    let currentValue = targetValue;
    let finalValue = 0;
    // Amortissement
    const dampingFactor = 0.1;

    function updateSlider() {
        currentValue += (targetValue - currentValue) * dampingFactor;

        finalValue = Math.round(Math.round(currentValue / 1) * 1);
        yearSlider.value = finalValue;
        yearDisplay.innerText = Math.round(yearSlider.value / 25) * 25;

        if (Math.abs(targetValue - currentValue) > 0.1) {
            requestAnimationFrame(updateSlider);
        }
    }

    yearSlider.addEventListener('input', () => {
        targetValue = parseInt(yearSlider.value);
        yearDisplay.innerText = targetValue;
        if (Math.abs(targetValue - currentValue) > 0.1) {
            updateSlider();
        } else {
            currentValue = targetValue;
        }
    });

    yearSlider.addEventListener('change', () => {
        targetValue = parseInt(yearSlider.value);
        yearDisplay.innerText = targetValue;
        currentValue = targetValue;
    });
});
