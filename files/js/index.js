const key = 'c7jzuBY8dijQYbCwt4AQ';
const map = L.map('map').setView([50, 10], 4);

const economicSystemColors = {
    'Socialisme': '#ff7f0e',
    'Capitalisme': '#1f77b4',
    'Communisme': '#2ca02c',
    'Fascism': '#d62728',
    'Monarchie': '#310d94',
    'Mixed Economy': '#9467bd' // Default color
};

L.tileLayer(`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${key}`, {
    tileSize: 512,
    zoomOffset: -1,
    minZoom: 1,
    attribution: "<a href='https://www.maptiler.com/copyright/' target='_blank'>&copy; MapTiler</a> <a href='https://www.openstreetmap.org/copyright' target='_blank'>&copy; OpenStreetMap contributors</a>",
    crossOrigin: true
}).addTo(map);

let economicData = {};

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
            geojson.setStyle(getStyle); // Call setStyle after economicData is updated
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

// Fetch and load GeoJSON data
const geojson = new L.GeoJSON.AJAX(`https://api.maptiler.com/data/13a81e89-4223-40dc-bcb9-407bf4cf1dd8/features.json?key=${key}`, {
    onEachFeature: function (feature, layer) {
        popup(feature, layer);
    },
    style: getStyle
}).addTo(map);

// Initialize the slider and display year information
document.addEventListener('DOMContentLoaded', () => {
    const yearSlider = document.getElementById('inputRangeYear');
    const yearDisplay = document.createElement('div');

    fetchEconomicData(2024);

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
        // Fetch initial data based on the starting slider value
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
document.addEventListener('mousedown', function () {
    removeHighlight(); // Clear any existing highlights
});

document.addEventListener('mousemove', function () {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (!range.collapsed) {
            highlightSelection(selection);
        }
    }
});

document.addEventListener('mouseup', function () {
    removeHighlight(); // Remove the highlight when the mouse is released
});

// Function to apply highlight to each selected text node
function highlightSelection(selection) {
    removeHighlight(); // Ensure no duplicate highlights
    const range = selection.getRangeAt(0);

    // Use a document fragment to store the new elements
    const fragment = range.cloneContents();
    traverseTextNodes(fragment, function (textNode) {
        const span = document.createElement('span');
        span.classList.add('highlight');
        span.textContent = textNode.textContent;
        textNode.replaceWith(span);
    });

    // Replace the original range contents with the highlighted fragment
    range.deleteContents();
    range.insertNode(fragment);
}

// Helper function to traverse text nodes in a document fragment
function traverseTextNodes(fragment, callback) {
    const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while (node = walker.nextNode()) {
        callback(node);
    }
}

// Function to remove highlights
function removeHighlight() {
    const highlightedElements = document.querySelectorAll('.highlight');
    highlightedElements.forEach(span => {
        const parent = span.parentNode;
        while (span.firstChild) {
            parent.insertBefore(span.firstChild, span);
        }
        parent.removeChild(span);
    });
}