/**
 * Week 2 JavaScript file for Air Quality Predictor
 * Handles data loading and preprocessing
 */

// Global variables to store loaded data
let currentData = null;
let dataSource = null;

// Initialize the page when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Week 2 page initialized');
    
    // Set up event listeners for the data loading buttons
    document.getElementById('loadCsvButton').addEventListener('click', handleCsvUpload);
    document.getElementById('fetchApiButton').addEventListener('click', handleApiFetch);
    document.getElementById('loadSampleButton').addEventListener('click', handleSampleLoad);
    
    // Update the current date in the footer
    const footer = document.querySelector('footer p');
    const currentYear = new Date().getFullYear();
    if (footer) {
        footer.textContent = `Air Quality Predictor © ${currentYear}`;
    }
});

/**
 * Handle CSV file upload
 */
function handleCsvUpload() {
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a CSV file to upload.');
        return;
    }
    
    // Check if file is a CSV
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        alert('Please upload a valid CSV file.');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const csvData = e.target.result;
            const parsedData = parseCSV(csvData);
            
            if (parsedData && parsedData.length > 0) {
                currentData = parsedData;
                dataSource = 'CSV: ' + file.name;
                
                // Process and display the data
                processData(parsedData);
            } else {
                throw new Error('No data found in the CSV file.');
            }
        } catch (error) {
            console.error('Error parsing CSV:', error);
            alert('Error parsing CSV file: ' + error.message);
        }
    };
    
    reader.onerror = function() {
        console.error('Error reading file');
        alert('Error reading file. Please try again.');
    };
    
    reader.readAsText(file);
}

/**
 * Handle API data fetching
 */
function handleApiFetch() {
    const location = document.getElementById('locationInput').value.trim();
    const apiSource = document.getElementById('apiSelect').value;
    
    if (!location) {
        alert('Please enter a location.');
        return;
    }
    
    // Show loading indicator
    const dataPreviewContainer = document.getElementById('dataPreviewContainer');
    dataPreviewContainer.innerHTML = '<p class="text-center">Loading data from API...</p>';
    
    // In a real application, we would make an actual API call here
    // For this prototype, we'll simulate an API response with a timeout
    setTimeout(() => {
        try {
            // Simulate API data based on the selected source and location
            const apiData = generateSampleApiData(apiSource, location);
            
            if (apiData && apiData.length > 0) {
                currentData = apiData;
                dataSource = `${apiSource.toUpperCase()} API: ${location}`;
                
                // Process and display the data
                processData(apiData);
            } else {
                throw new Error('No data found for the specified location.');
            }
        } catch (error) {
            console.error('Error fetching API data:', error);
            dataPreviewContainer.innerHTML = `<p class="text-center text-danger">Error: ${error.message}</p>`;
        }
    }, 1500); // Simulate network delay
}

/**
 * Handle loading sample data
 */
function handleSampleLoad() {
    const sampleType = document.getElementById('sampleSelect').value;
    
    // Show loading indicator
    const dataPreviewContainer = document.getElementById('dataPreviewContainer');
    dataPreviewContainer.innerHTML = '<p class="text-center">Loading sample data...</p>';
    
    // Simulate loading delay
    setTimeout(() => {
        try {
            // Load sample data based on the selected type
            const sampleData = getSampleData(sampleType);
            
            if (sampleData && sampleData.length > 0) {
                currentData = sampleData;
                dataSource = `Sample: ${getSampleName(sampleType)}`;
                
                // Process and display the data
                processData(sampleData);
            } else {
                throw new Error('Error loading sample data.');
            }
        } catch (error) {
            console.error('Error loading sample data:', error);
            dataPreviewContainer.innerHTML = `<p class="text-center text-danger">Error: ${error.message}</p>`;
        }
    }, 800);
}

/**
 * Process and display the loaded data
 * @param {Array} data - The data to process and display
 */
function processData(data) {
    // Perform basic data validation and preprocessing
    const processedData = preprocessData(data);
    
    // Display data preview
    displayDataPreview(processedData);
    
    // Store the processed data for later use
    currentData = processedData;
    
    // Save to localStorage for persistence between pages
    try {
        localStorage.setItem('airQualityData', JSON.stringify({
            source: dataSource,
            data: processedData,
            timestamp: new Date().toISOString()
        }));
        console.log('Data saved to localStorage');
    } catch (error) {
        console.warn('Could not save data to localStorage:', error);
    }
}

/**
 * Preprocess the data for analysis
 * @param {Array} data - The raw data to preprocess
 * @returns {Array} The preprocessed data
 */
function preprocessData(data) {
    // Make a deep copy of the data to avoid modifying the original
    const processedData = JSON.parse(JSON.stringify(data));
    
    // Basic preprocessing steps
    return processedData.map(item => {
        // Ensure date is in a consistent format
        if (item.date) {
            item.date = formatDate(new Date(item.date));
        }
        
        // Convert string numeric values to actual numbers
        Object.keys(item).forEach(key => {
            if (key !== 'date' && key !== 'location' && !isNaN(item[key])) {
                item[key] = parseFloat(item[key]);
            }
        });
        
        return item;
    });
}

/**
 * Display a preview of the data in the UI
 * @param {Array} data - The data to display
 */
function displayDataPreview(data) {
    const dataPreviewContainer = document.getElementById('dataPreviewContainer');
    
    if (!data || data.length === 0) {
        dataPreviewContainer.innerHTML = '<p class="text-center text-muted">No data available.</p>';
        return;
    }
    
    // Create a table to display the data
    const headers = Object.keys(data[0]);
    const previewData = data.slice(0, 10); // Show only the first 10 rows
    
    let tableHtml = `
        <div class="table-responsive">
            <table class="table table-striped table-hover">
                <thead>
                    <tr>
                        ${headers.map(header => `<th>${header}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
    `;
    
    previewData.forEach(row => {
        tableHtml += '<tr>';
        headers.forEach(header => {
            tableHtml += `<td>${row[header]}</td>`;
        });
        tableHtml += '</tr>';
    });
    
    tableHtml += `
                </tbody>
            </table>
        </div>
        <p class="text-muted">Showing ${previewData.length} of ${data.length} rows from ${dataSource}</p>
        <div class="d-flex justify-content-between">
            <button id="downloadDataButton" class="btn btn-outline-primary">Download Processed Data</button>
            <button id="continueToAnalysisButton" class="btn btn-success">Continue to Week 3</button>
        </div>
    `;
    
    dataPreviewContainer.innerHTML = tableHtml;
    
    // Add event listeners to the new buttons
    document.getElementById('downloadDataButton').addEventListener('click', () => downloadData(data));
    document.getElementById('continueToAnalysisButton').addEventListener('click', () => {
        window.location.href = '../Week3/';
    });
}

/**
 * Download the processed data as a CSV file
 * @param {Array} data - The data to download
 */
function downloadData(data) {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            // Handle values that contain commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csvContent += values.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'air_quality_data_processed.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Generate sample API data for demonstration purposes
 * @param {string} apiSource - The API source
 * @param {string} location - The location
 * @returns {Array} Sample API data
 */
function generateSampleApiData(apiSource, location) {
    // Generate 30 days of sample data
    const data = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Generate random values based on the location and API source
        // This is just for demonstration purposes
        const baseValue = location.toLowerCase().includes('beijing') ? 80 : 
                         location.toLowerCase().includes('delhi') ? 100 : 
                         location.toLowerCase().includes('london') ? 40 : 60;
        
        const variance = Math.sin(i / 5) * 20; // Add some cyclical variation
        
        data.push({
            date: formatDate(date),
            location: location,
            pm25: Math.max(5, Math.round((baseValue + variance + Math.random() * 30) * 0.8)),
            pm10: Math.max(10, Math.round(baseValue + variance + Math.random() * 40)),
            o3: (Math.random() * 0.04 + 0.02).toFixed(3),
            no2: Math.round(Math.random() * 30 + 20),
            so2: Math.round(Math.random() * 10 + 5),
            co: (Math.random() * 1.5 + 0.5).toFixed(1),
            aqi: Math.round(baseValue + variance + Math.random() * 20)
        });
    }
    
    return data;
}

/**
 * Get sample data based on the selected type
 * @param {string} sampleType - The type of sample data to get
 * @returns {Array} Sample data
 */
function getSampleData(sampleType) {
    // In a real application, these would be loaded from actual files
    // For this prototype, we'll generate them
    
    let baseValue, startYear, location;
    
    switch (sampleType) {
        case 'beijing':
            baseValue = 80;
            startYear = 2013;
            location = 'Beijing, China';
            break;
        case 'london':
            baseValue = 40;
            startYear = 2018;
            location = 'London, UK';
            break;
        case 'delhi':
            baseValue = 100;
            startYear = 2019;
            location = 'Delhi, India';
            break;
        default:
            baseValue = 60;
            startYear = 2020;
            location = 'Sample City';
    }
    
    // Generate 100 data points with realistic patterns
    const data = [];
    
    for (let i = 0; i < 100; i++) {
        const date = new Date(startYear, 0, 1);
        date.setDate(date.getDate() + i);
        
        // Create seasonal patterns
        const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        const seasonalFactor = Math.sin(dayOfYear / 365 * 2 * Math.PI) * 30;
        
        // Add weekly patterns (weekends have lower pollution)
        const dayOfWeek = date.getDay();
        const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? -15 : 0;
        
        // Add some random noise
        const noise = Math.random() * 20 - 10;
        
        // Calculate the final value with all factors
        const value = Math.max(10, Math.round(baseValue + seasonalFactor + weekendFactor + noise));
        
        data.push({
            date: formatDate(date),
            location: location,
            pm25: Math.round(value * 0.8),
            pm10: value,
            o3: (Math.random() * 0.04 + 0.02).toFixed(3),
            no2: Math.round(Math.random() * 30 + 20),
            so2: Math.round(Math.random() * 10 + 5),
            co: (Math.random() * 1.5 + 0.5).toFixed(1),
            aqi: value
        });
    }
    
    return data;
}

/**
 * Get the display name for a sample dataset
 * @param {string} sampleType - The sample type
 * @returns {string} The display name
 */
function getSampleName(sampleType) {
    const names = {
        'beijing': 'Beijing Air Quality (2013-2017)',
        'london': 'London Air Quality (2018-2022)',
        'delhi': 'Delhi Air Quality (2019-2023)'
    };
    
    return names[sampleType] || 'Sample Dataset';
}