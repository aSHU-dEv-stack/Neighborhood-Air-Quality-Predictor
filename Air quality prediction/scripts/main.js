/**
 * Main JavaScript file for Air Quality Predictor
 */

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Air Quality Predictor application initialized');
    
    // Check if we're on the home page
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
        initHomePage();
    }
});

/**
 * Initialize the home page functionality
 */
function initHomePage() {
    // Add event listeners for navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            this.classList.add('active');
        });
    });

    // Display current date in the footer
    const footer = document.querySelector('footer p');
    const currentYear = new Date().getFullYear();
    if (footer) {
        footer.textContent = `Air Quality Predictor © ${currentYear}`;
    }
}

/**
 * Utility function to format date strings
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string (YYYY-MM-DD)
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Utility function to parse CSV data
 * @param {string} csvText - The CSV text to parse
 * @returns {Array} Array of objects representing the CSV data
 */
function parseCSV(csvText) {
    // Split the text into lines
    const lines = csvText.trim().split('\n');
    
    // Extract the header row and parse it into column names
    const headers = lines[0].split(',').map(header => header.trim());
    
    // Map the remaining rows into objects
    const result = lines.slice(1).map(line => {
        const values = line.split(',').map(value => value.trim());
        const row = {};
        
        headers.forEach((header, index) => {
            // Try to convert numeric values
            const value = values[index];
            row[header] = isNaN(value) ? value : Number(value);
        });
        
        return row;
    });
    
    return result;
}

/**
 * Utility function to determine AQI color based on value
 * @param {number} aqi - The AQI value
 * @returns {string} CSS color class for the AQI value
 */
function getAQIColorClass(aqi) {
    if (aqi <= 50) return 'aqi-good';
    if (aqi <= 100) return 'aqi-moderate';
    if (aqi <= 150) return 'aqi-unhealthy-sensitive';
    if (aqi <= 200) return 'aqi-unhealthy';
    if (aqi <= 300) return 'aqi-very-unhealthy';
    return 'aqi-hazardous';
}

/**
 * Utility function to create a chart using Chart.js
 * @param {string} canvasId - The ID of the canvas element
 * @param {Array} data - The data for the chart
 * @param {string} type - The type of chart to create
 * @param {Object} options - Additional options for the chart
 * @returns {Chart} The created chart instance
 */
function createChart(canvasId, data, type = 'line', options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    const ctx = canvas.getContext('2d');
    return new Chart(ctx, {
        type: type,
        data: data,
        options: options
    });
}