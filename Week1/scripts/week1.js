/**
 * Week 1 JavaScript file for Air Quality Predictor
 * Handles basic visualization of sample air quality data
 */

// Sample air quality data (to be replaced with real data in Week 2)
const sampleData = {
    pm25: [
        { date: '2023-01-01', value: 35 },
        { date: '2023-01-02', value: 42 },
        { date: '2023-01-03', value: 28 },
        { date: '2023-01-04', value: 51 },
        { date: '2023-01-05', value: 75 },
        { date: '2023-01-06', value: 62 },
        { date: '2023-01-07', value: 45 }
    ],
    pm10: [
        { date: '2023-01-01', value: 65 },
        { date: '2023-01-02', value: 72 },
        { date: '2023-01-03', value: 58 },
        { date: '2023-01-04', value: 81 },
        { date: '2023-01-05', value: 95 },
        { date: '2023-01-06', value: 82 },
        { date: '2023-01-07', value: 75 }
    ],
    o3: [
        { date: '2023-01-01', value: 0.032 },
        { date: '2023-01-02', value: 0.041 },
        { date: '2023-01-03', value: 0.038 },
        { date: '2023-01-04', value: 0.052 },
        { date: '2023-01-05', value: 0.061 },
        { date: '2023-01-06', value: 0.045 },
        { date: '2023-01-07', value: 0.039 }
    ],
    no2: [
        { date: '2023-01-01', value: 21 },
        { date: '2023-01-02', value: 32 },
        { date: '2023-01-03', value: 28 },
        { date: '2023-01-04', value: 35 },
        { date: '2023-01-05', value: 42 },
        { date: '2023-01-06', value: 38 },
        { date: '2023-01-07', value: 25 }
    ],
    so2: [
        { date: '2023-01-01', value: 5 },
        { date: '2023-01-02', value: 8 },
        { date: '2023-01-03', value: 6 },
        { date: '2023-01-04', value: 12 },
        { date: '2023-01-05', value: 15 },
        { date: '2023-01-06', value: 9 },
        { date: '2023-01-07', value: 7 }
    ],
    co: [
        { date: '2023-01-01', value: 0.8 },
        { date: '2023-01-02', value: 1.2 },
        { date: '2023-01-03', value: 0.9 },
        { date: '2023-01-04', value: 1.5 },
        { date: '2023-01-05', value: 1.8 },
        { date: '2023-01-06', value: 1.3 },
        { date: '2023-01-07', value: 1.0 }
    ]
};

// AQI categories and descriptions
const aqiCategories = [
    { range: [0, 50], level: 'Good', color: '#00e400', description: 'Air quality is satisfactory, and air pollution poses little or no risk.' },
    { range: [51, 100], level: 'Moderate', color: '#ffff00', description: 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.' },
    { range: [101, 150], level: 'Unhealthy for Sensitive Groups', color: '#ff7e00', description: 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.' },
    { range: [151, 200], level: 'Unhealthy', color: '#ff0000', description: 'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.' },
    { range: [201, 300], level: 'Very Unhealthy', color: '#99004c', description: 'Health alert: The risk of health effects is increased for everyone.' },
    { range: [301, 500], level: 'Hazardous', color: '#7e0023', description: 'Health warning of emergency conditions: everyone is more likely to be affected.' }
];

// Chart instance
let airQualityChart;

// Initialize the page when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Week 1 page initialized');
    
    // Set up the pollutant selector
    const pollutantSelect = document.getElementById('pollutantSelect');
    if (pollutantSelect) {
        pollutantSelect.addEventListener('change', function() {
            updateChart(this.value);
        });
        
        // Initialize with the first option
        updateChart(pollutantSelect.value);
    }
    
    // Update the current date in the footer
    const footer = document.querySelector('footer p');
    const currentYear = new Date().getFullYear();
    if (footer) {
        footer.textContent = `Air Quality Predictor © ${currentYear}`;
    }
});

/**
 * Update the chart based on the selected pollutant
 * @param {string} pollutant - The selected pollutant
 */
function updateChart(pollutant) {
    const data = sampleData[pollutant];
    if (!data) return;
    
    // Prepare data for Chart.js
    const labels = data.map(item => item.date);
    const values = data.map(item => item.value);
    
    // Determine chart color based on the last value (current AQI)
    const currentValue = values[values.length - 1];
    const aqiInfo = getAQIInfo(currentValue, pollutant);
    
    // Update the current AQI display
    updateAQIDisplay(currentValue, aqiInfo);
    
    // Create or update the chart
    const chartData = {
        labels: labels,
        datasets: [{
            label: getPollutantLabel(pollutant),
            data: values,
            borderColor: aqiInfo.color,
            backgroundColor: aqiInfo.color + '33', // Add transparency
            tension: 0.1,
            fill: true
        }]
    };
    
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: getPollutantUnit(pollutant)
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Date'
                }
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const value = context.raw;
                        return `${getPollutantLabel(pollutant)}: ${value} ${getPollutantUnit(pollutant)}`;
                    }
                }
            }
        }
    };
    
    // Create or update chart
    const ctx = document.getElementById('airQualityChart').getContext('2d');
    
    if (airQualityChart) {
        airQualityChart.data = chartData;
        airQualityChart.options = chartOptions;
        airQualityChart.update();
    } else {
        airQualityChart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: chartOptions
        });
    }
}

/**
 * Update the AQI display with the current value and category
 * @param {number} value - The current AQI value
 * @param {Object} aqiInfo - Information about the AQI category
 */
function updateAQIDisplay(value, aqiInfo) {
    const currentAQI = document.getElementById('currentAQI');
    const aqiDescription = document.getElementById('aqiDescription');
    const healthRecommendation = document.getElementById('healthRecommendation');
    
    if (currentAQI && aqiDescription && healthRecommendation) {
        // Update the AQI value and color
        currentAQI.textContent = Math.round(value);
        currentAQI.className = ''; // Clear existing classes
        currentAQI.style.color = aqiInfo.color;
        
        // Update the description and recommendation
        aqiDescription.textContent = aqiInfo.level;
        healthRecommendation.textContent = aqiInfo.description;
    }
}

/**
 * Get information about the AQI category based on the value
 * @param {number} value - The AQI value
 * @param {string} pollutant - The pollutant type
 * @returns {Object} Information about the AQI category
 */
function getAQIInfo(value, pollutant) {
    // Convert pollutant-specific values to AQI equivalent for display
    // This is a simplified conversion for demonstration purposes
    let aqiValue = value;
    
    // Simple conversion factors (for demonstration only)
    switch (pollutant) {
        case 'o3':
            aqiValue = value * 1000; // Convert from ppm to ppb and then approximate AQI
            break;
        case 'co':
            aqiValue = value * 50; // Simple approximation
            break;
    }
    
    // Find the appropriate AQI category
    for (const category of aqiCategories) {
        if (aqiValue >= category.range[0] && aqiValue <= category.range[1]) {
            return {
                level: category.level,
                color: category.color,
                description: category.description
            };
        }
    }
    
    // Default to the highest category if value exceeds all ranges
    const lastCategory = aqiCategories[aqiCategories.length - 1];
    return {
        level: lastCategory.level,
        color: lastCategory.color,
        description: lastCategory.description
    };
}

/**
 * Get the display label for a pollutant
 * @param {string} pollutant - The pollutant code
 * @returns {string} The display label
 */
function getPollutantLabel(pollutant) {
    const labels = {
        pm25: 'PM2.5',
        pm10: 'PM10',
        o3: 'Ozone (O₃)',
        no2: 'Nitrogen Dioxide (NO₂)',
        so2: 'Sulfur Dioxide (SO₂)',
        co: 'Carbon Monoxide (CO)'
    };
    
    return labels[pollutant] || pollutant;
}

/**
 * Get the unit for a pollutant
 * @param {string} pollutant - The pollutant code
 * @returns {string} The unit
 */
function getPollutantUnit(pollutant) {
    const units = {
        pm25: 'μg/m³',
        pm10: 'μg/m³',
        o3: 'ppm',
        no2: 'ppb',
        so2: 'ppb',
        co: 'ppm'
    };
    
    return units[pollutant] || '';
}