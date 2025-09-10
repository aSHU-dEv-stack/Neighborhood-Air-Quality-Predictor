/**
 * Week 4 JavaScript file for Air Quality Predictor
 * Handles prediction implementation and visualization
 */

// Global variables
let airQualityData = null;
let modelInfo = null;
let predictionChart = null;
let selectedFeatures = [];
let targetFeature = '';
let dataMeans = {};
let dataStds = {};

// Initialize the page when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Week 4 page initialized');
    
    // Check for model and data from localStorage
    checkForModelAndData();
    
    // Set up event listeners
    document.getElementById('predictionType').addEventListener('change', handlePredictionTypeChange);
    document.getElementById('makePredictionButton').addEventListener('click', makePrediction);
    document.getElementById('exportResultsButton').addEventListener('click', exportResults);
    
    // Update the current date in the footer
    const footer = document.querySelector('footer p');
    const currentYear = new Date().getFullYear();
    if (footer) {
        footer.textContent = `Air Quality Predictor © ${currentYear}`;
    }
});

/**
 * Check for available model and data in localStorage
 */
function checkForModelAndData() {
    try {
        // Check for model info
        const storedModelInfo = localStorage.getItem('airQualityModelInfo');
        const storedData = localStorage.getItem('airQualityData');
        
        if (storedModelInfo && storedData) {
            modelInfo = JSON.parse(storedModelInfo);
            airQualityData = JSON.parse(storedData).data;
            
            // Extract model parameters
            targetFeature = modelInfo.targetFeature;
            selectedFeatures = modelInfo.selectedFeatures;
            dataMeans = modelInfo.dataMeans;
            dataStds = modelInfo.dataStds;
            
            // Update the model status card
            const modelStatusContainer = document.getElementById('modelStatusContainer');
            modelStatusContainer.innerHTML = `
                <div class="alert alert-success mb-0">
                    <h5>Model Available</h5>
                    <p>Target Feature: ${targetFeature}</p>
                    <p>Input Features: ${selectedFeatures.join(', ')}</p>
                    <p>Trained: ${new Date(modelInfo.timestamp).toLocaleString()}</p>
                </div>
            `;
            
            // Set up custom input fields if needed
            setupCustomInputFields();
            
        } else if (!storedModelInfo) {
            showNoModelMessage();
        } else {
            showNoDataMessage();
        }
    } catch (error) {
        console.error('Error loading model or data from localStorage:', error);
        showNoModelMessage();
    }
}

/**
 * Show a message when no model is available
 */
function showNoModelMessage() {
    const modelStatusContainer = document.getElementById('modelStatusContainer');
    modelStatusContainer.innerHTML = `
        <div class="alert alert-warning mb-0">
            <h5>No Model Available</h5>
            <p>Please go to Week 3 to train a model first.</p>
            <a href="../Week3/" class="btn btn-primary">Go to Week 3</a>
        </div>
    `;
    
    // Disable the prediction form
    document.getElementById('predictionCard').querySelectorAll('input, select, button').forEach(element => {
        element.disabled = true;
    });
}

/**
 * Show a message when no data is available
 */
function showNoDataMessage() {
    const modelStatusContainer = document.getElementById('modelStatusContainer');
    modelStatusContainer.innerHTML = `
        <div class="alert alert-warning mb-0">
            <h5>No Data Available</h5>
            <p>Please go to Week 2 to load or generate data first.</p>
            <a href="../Week2/" class="btn btn-primary">Go to Week 2</a>
        </div>
    `;
    
    // Disable the prediction form
    document.getElementById('predictionCard').querySelectorAll('input, select, button').forEach(element => {
        element.disabled = true;
    });
}

/**
 * Set up custom input fields for manual prediction
 */
function setupCustomInputFields() {
    const customFeatureInputs = document.getElementById('customFeatureInputs');
    customFeatureInputs.innerHTML = '';
    
    selectedFeatures.forEach(feature => {
        const col = document.createElement('div');
        col.className = 'col-md-6 mb-3';
        
        const label = document.createElement('label');
        label.className = 'form-label';
        label.htmlFor = `input-${feature}`;
        label.textContent = `${feature} (${getUnitForFeature(feature)}):`;
        
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'form-control';
        input.id = `input-${feature}`;
        input.name = feature;
        input.step = 'any';
        input.value = dataMeans[feature] ? dataMeans[feature].toFixed(2) : 0;
        
        col.appendChild(label);
        col.appendChild(input);
        customFeatureInputs.appendChild(col);
    });
}

/**
 * Handle prediction type change
 */
function handlePredictionTypeChange() {
    const predictionType = document.getElementById('predictionType').value;
    const customInputContainer = document.getElementById('customInputContainer');
    
    if (predictionType === 'custom') {
        customInputContainer.style.display = 'block';
    } else {
        customInputContainer.style.display = 'none';
    }
}

/**
 * Make a prediction based on the selected type
 */
function makePrediction() {
    const predictionType = document.getElementById('predictionType').value;
    const predictionDays = parseInt(document.getElementById('predictionDays').value);
    
    if (!modelInfo || !airQualityData) {
        alert('Model or data not available. Please train a model in Week 3 first.');
        return;
    }
    
    try {
        let inputData, dates, actualValues;
        
        switch (predictionType) {
            case 'historical':
                // Use historical data for prediction
                ({ inputData, dates, actualValues } = prepareHistoricalData(predictionDays));
                break;
                
            case 'future':
                // Predict future values
                ({ inputData, dates } = prepareFuturePredictionData(predictionDays));
                actualValues = null; // No actual values for future predictions
                break;
                
            case 'custom':
                // Use custom input values
                inputData = getCustomInputData();
                dates = [formatDate(new Date())];
                actualValues = null; // No actual values for custom input
                break;
        }
        
        // Make predictions
        const predictions = predictValues(inputData);
        
        // Display results
        displayPredictionResults(dates, predictions, actualValues, predictionType);
        
    } catch (error) {
        console.error('Error making prediction:', error);
        alert('Error making prediction: ' + error.message);
    }
}

/**
 * Prepare historical data for prediction
 * @param {number} days - Number of days to predict
 * @returns {Object} Object containing input data, dates, and actual values
 */
function prepareHistoricalData(days) {
    // Use the last 'days' days of data for prediction
    const startIndex = Math.max(0, airQualityData.length - days);
    const predictionData = airQualityData.slice(startIndex);
    
    // Extract dates and actual values
    const dates = predictionData.map(item => item.date);
    const actualValues = predictionData.map(item => item[targetFeature]);
    
    // Prepare normalized input data
    const inputData = predictionData.map(item => {
        const normalizedItem = {};
        selectedFeatures.forEach(feature => {
            normalizedItem[feature] = (item[feature] - dataMeans[feature]) / (dataStds[feature] || 1);
        });
        return normalizedItem;
    });
    
    return { inputData, dates, actualValues };
}

/**
 * Prepare data for future prediction
 * @param {number} days - Number of days to predict
 * @returns {Object} Object containing input data and dates
 */
function prepareFuturePredictionData(days) {
    // Use the last available data point as a starting point
    const lastDataPoint = airQualityData[airQualityData.length - 1];
    
    // Generate future dates
    const dates = [];
    const lastDate = new Date(lastDataPoint.date);
    
    for (let i = 1; i <= days; i++) {
        const futureDate = new Date(lastDate);
        futureDate.setDate(lastDate.getDate() + i);
        dates.push(formatDate(futureDate));
    }
    
    // For simplicity, we'll use the last data point for all predictions
    // In a real application, we would use a more sophisticated approach
    const normalizedItem = {};
    selectedFeatures.forEach(feature => {
        normalizedItem[feature] = (lastDataPoint[feature] - dataMeans[feature]) / (dataStds[feature] || 1);
    });
    
    const inputData = Array(days).fill(normalizedItem);
    
    return { inputData, dates };
}

/**
 * Get custom input data from the form
 * @returns {Array} Array of normalized input data
 */
function getCustomInputData() {
    const normalizedItem = {};
    
    selectedFeatures.forEach(feature => {
        const inputElement = document.getElementById(`input-${feature}`);
        const value = parseFloat(inputElement.value);
        
        if (isNaN(value)) {
            throw new Error(`Invalid value for ${feature}. Please enter a number.`);
        }
        
        normalizedItem[feature] = (value - dataMeans[feature]) / (dataStds[feature] || 1);
    });
    
    return [normalizedItem];
}

/**
 * Predict values using the model
 * @param {Array} inputData - Normalized input data
 * @returns {Array} Predicted values
 */
function predictValues(inputData) {
    // In a real application, we would use the actual TensorFlow.js model
    // For this prototype, we'll simulate predictions
    
    // Convert input data to the format expected by the model
    const inputTensor = tf.tensor2d(
        inputData.map(item => selectedFeatures.map(feature => item[feature]))
    );
    
    // Simulate model prediction
    // In a real application, this would be: const predictions = model.predict(inputTensor);
    const rawPredictions = simulatePrediction(inputTensor, inputData);
    
    // Denormalize predictions
    const denormalizedPredictions = rawPredictions.map(value => 
        value * (dataStds[targetFeature] || 1) + dataMeans[targetFeature]
    );
    
    return denormalizedPredictions;
}

/**
 * Simulate model prediction (for prototype only)
 * @param {Tensor} inputTensor - Input tensor
 * @param {Array} inputData - Input data
 * @returns {Array} Simulated predictions
 */
function simulatePrediction(inputTensor, inputData) {
    // This is a simplified simulation for the prototype
    // In a real application, we would use the actual model
    
    // Create a simple linear combination of the input features
    const predictions = [];
    
    inputData.forEach(item => {
        let prediction = 0;
        
        // Simple weighted sum of features
        selectedFeatures.forEach(feature => {
            // Random weight between 0.5 and 1.5
            const weight = 0.5 + Math.random();
            prediction += item[feature] * weight;
        });
        
        // Add some noise
        prediction += (Math.random() - 0.5) * 0.2;
        
        predictions.push(prediction);
    });
    
    return predictions;
}

/**
 * Display prediction results
 * @param {Array} dates - Array of dates
 * @param {Array} predictions - Array of predicted values
 * @param {Array} actualValues - Array of actual values (if available)
 * @param {string} predictionType - Type of prediction
 */
function displayPredictionResults(dates, predictions, actualValues, predictionType) {
    // Show the results card
    document.getElementById('resultsCard').style.display = 'block';
    
    // Create or update the prediction chart
    createPredictionChart(dates, predictions, actualValues, predictionType);
    
    // Display metrics if actual values are available
    if (actualValues) {
        displayMetrics(predictions, actualValues);
    } else {
        document.getElementById('metricsContainer').innerHTML = '<p>No actual values available for comparison.</p>';
    }
    
    // Display prediction details
    displayPredictionDetails(dates, predictions, predictionType);
}

/**
 * Create or update the prediction chart
 * @param {Array} dates - Array of dates
 * @param {Array} predictions - Array of predicted values
 * @param {Array} actualValues - Array of actual values (if available)
 * @param {string} predictionType - Type of prediction
 */
function createPredictionChart(dates, predictions, actualValues, predictionType) {
    const ctx = document.getElementById('predictionChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (predictionChart) {
        predictionChart.destroy();
    }
    
    // Prepare datasets
    const datasets = [
        {
            label: `Predicted ${targetFeature}`,
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            data: predictions,
            fill: true
        }
    ];
    
    // Add actual values if available
    if (actualValues) {
        datasets.push({
            label: `Actual ${targetFeature}`,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            data: actualValues,
            fill: true
        });
    }
    
    // Create the chart
    predictionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: `${targetFeature} (${getUnitForFeature(targetFeature)})`
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
                title: {
                    display: true,
                    text: getPredictionTitle(predictionType)
                }
            }
        }
    });
}

/**
 * Display prediction metrics
 * @param {Array} predictions - Array of predicted values
 * @param {Array} actualValues - Array of actual values
 */
function displayMetrics(predictions, actualValues) {
    // Calculate metrics
    const mse = calculateMSE(predictions, actualValues);
    const mae = calculateMAE(predictions, actualValues);
    const rmse = Math.sqrt(mse);
    
    // Display metrics
    document.getElementById('metricsContainer').innerHTML = `
        <table class="table table-sm">
            <tr>
                <th>Mean Squared Error:</th>
                <td>${mse.toFixed(4)}</td>
            </tr>
            <tr>
                <th>Mean Absolute Error:</th>
                <td>${mae.toFixed(4)} ${getUnitForFeature(targetFeature)}</td>
            </tr>
            <tr>
                <th>Root Mean Squared Error:</th>
                <td>${rmse.toFixed(4)} ${getUnitForFeature(targetFeature)}</td>
            </tr>
        </table>
    `;
}

/**
 * Display prediction details
 * @param {Array} dates - Array of dates
 * @param {Array} predictions - Array of predicted values
 * @param {string} predictionType - Type of prediction
 */
function displayPredictionDetails(dates, predictions, predictionType) {
    let detailsHtml = `<p><strong>Prediction Type:</strong> ${getPredictionTypeLabel(predictionType)}</p>`;
    
    if (predictionType === 'custom') {
        // Show input values for custom prediction
        detailsHtml += '<p><strong>Input Values:</strong></p>';
        detailsHtml += '<ul>';
        
        selectedFeatures.forEach(feature => {
            const inputElement = document.getElementById(`input-${feature}`);
            detailsHtml += `<li>${feature}: ${inputElement.value} ${getUnitForFeature(feature)}</li>`;
        });
        
        detailsHtml += '</ul>';
    } else {
        // Show date range for historical or future predictions
        detailsHtml += `<p><strong>Date Range:</strong> ${dates[0]} to ${dates[dates.length - 1]}</p>`;
        detailsHtml += `<p><strong>Number of Days:</strong> ${dates.length}</p>`;
    }
    
    // Show prediction summary
    const avgPrediction = predictions.reduce((sum, val) => sum + val, 0) / predictions.length;
    const minPrediction = Math.min(...predictions);
    const maxPrediction = Math.max(...predictions);
    
    detailsHtml += '<p><strong>Prediction Summary:</strong></p>';
    detailsHtml += `<ul>
        <li>Average: ${avgPrediction.toFixed(2)} ${getUnitForFeature(targetFeature)}</li>
        <li>Minimum: ${minPrediction.toFixed(2)} ${getUnitForFeature(targetFeature)}</li>
        <li>Maximum: ${maxPrediction.toFixed(2)} ${getUnitForFeature(targetFeature)}</li>
    </ul>`;
    
    document.getElementById('predictionDetailsContainer').innerHTML = detailsHtml;
}

/**
 * Export prediction results as CSV
 */
function exportResults() {
    if (!predictionChart) {
        alert('No prediction results to export.');
        return;
    }
    
    try {
        const chartData = predictionChart.data;
        const labels = chartData.labels;
        const datasets = chartData.datasets;
        
        // Create CSV content
        let csvContent = 'Date,';
        datasets.forEach(dataset => {
            csvContent += dataset.label + ',';
        });
        csvContent = csvContent.slice(0, -1) + '\n';
        
        // Add data rows
        for (let i = 0; i < labels.length; i++) {
            csvContent += labels[i] + ',';
            
            datasets.forEach(dataset => {
                csvContent += (dataset.data[i] !== undefined ? dataset.data[i] : '') + ',';
            });
            
            csvContent = csvContent.slice(0, -1) + '\n';
        }
        
        // Create and download the file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `air_quality_prediction_${formatDate(new Date())}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
    } catch (error) {
        console.error('Error exporting results:', error);
        alert('Error exporting results: ' + error.message);
    }
}

/**
 * Calculate Mean Squared Error
 * @param {Array} predictions - Array of predicted values
 * @param {Array} actualValues - Array of actual values
 * @returns {number} Mean Squared Error
 */
function calculateMSE(predictions, actualValues) {
    if (predictions.length !== actualValues.length) {
        throw new Error('Predictions and actual values must have the same length.');
    }
    
    let sumSquaredErrors = 0;
    
    for (let i = 0; i < predictions.length; i++) {
        const error = predictions[i] - actualValues[i];
        sumSquaredErrors += error * error;
    }
    
    return sumSquaredErrors / predictions.length;
}

/**
 * Calculate Mean Absolute Error
 * @param {Array} predictions - Array of predicted values
 * @param {Array} actualValues - Array of actual values
 * @returns {number} Mean Absolute Error
 */
function calculateMAE(predictions, actualValues) {
    if (predictions.length !== actualValues.length) {
        throw new Error('Predictions and actual values must have the same length.');
    }
    
    let sumAbsoluteErrors = 0;
    
    for (let i = 0; i < predictions.length; i++) {
        const error = Math.abs(predictions[i] - actualValues[i]);
        sumAbsoluteErrors += error;
    }
    
    return sumAbsoluteErrors / predictions.length;
}

/**
 * Get the unit for a feature
 * @param {string} feature - The feature
 * @returns {string} The unit
 */
function getUnitForFeature(feature) {
    const units = {
        pm25: 'μg/m³',
        pm10: 'μg/m³',
        o3: 'ppm',
        no2: 'ppb',
        so2: 'ppb',
        co: 'ppm',
        aqi: ''
    };
    
    return units[feature] || '';
}

/**
 * Get the title for the prediction chart
 * @param {string} predictionType - Type of prediction
 * @returns {string} Chart title
 */
function getPredictionTitle(predictionType) {
    switch (predictionType) {
        case 'historical':
            return 'Historical Data Prediction';
        case 'future':
            return 'Future Air Quality Forecast';
        case 'custom':
            return 'Custom Input Prediction';
        default:
            return 'Air Quality Prediction';
    }
}

/**
 * Get a label for the prediction type
 * @param {string} predictionType - Type of prediction
 * @returns {string} Prediction type label
 */
function getPredictionTypeLabel(predictionType) {
    switch (predictionType) {
        case 'historical':
            return 'Historical Data Prediction';
        case 'future':
            return 'Future Forecast';
        case 'custom':
            return 'Custom Input Prediction';
        default:
            return 'Prediction';
    }
}