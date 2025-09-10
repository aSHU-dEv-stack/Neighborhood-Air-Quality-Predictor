/**
 * Week 3 JavaScript file for Air Quality Predictor
 * Handles TensorFlow.js integration and model training
 */

// Global variables
let airQualityData = null;
let model = null;
let trainingHistory = [];
let availableFeatures = [];
let selectedFeatures = [];
let targetFeature = 'pm25';
let predictionHorizon = 1;
let trainingRatio = 0.8;
let normalizedData = null;
let dataMeans = {};
let dataStds = {};

// Initialize the page when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Week 3 page initialized');
    
    // Check for data from localStorage
    checkForData();
    
    // Set up event listeners
    document.getElementById('modelConfigForm').addEventListener('submit', function(e) {
        e.preventDefault();
        trainModel();
    });
    
    document.getElementById('trainingRatio').addEventListener('input', function() {
        const value = this.value;
        document.getElementById('trainingRatioValue').textContent = value + '%';
        trainingRatio = value / 100;
    });
    
    document.getElementById('saveModelButton').addEventListener('click', saveModel);
    document.getElementById('continueToWeek4Button').addEventListener('click', function() {
        window.location.href = '../Week4/';
    });
    
    // Update the current date in the footer
    const footer = document.querySelector('footer p');
    const currentYear = new Date().getFullYear();
    if (footer) {
        footer.textContent = `Air Quality Predictor © ${currentYear}`;
    }
});

/**
 * Check for available data in localStorage
 */
function checkForData() {
    try {
        const storedData = localStorage.getItem('airQualityData');
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            airQualityData = parsedData.data;
            
            // Update the data status card
            const dataStatusContainer = document.getElementById('dataStatusContainer');
            dataStatusContainer.innerHTML = `
                <div class="alert alert-success mb-0">
                    <h5>Data Available</h5>
                    <p>Source: ${parsedData.source}</p>
                    <p>Loaded: ${new Date(parsedData.timestamp).toLocaleString()}</p>
                    <p>Records: ${airQualityData.length}</p>
                </div>
            `;
            
            // Extract available features
            if (airQualityData && airQualityData.length > 0) {
                availableFeatures = Object.keys(airQualityData[0]).filter(key => 
                    key !== 'date' && key !== 'location'
                );
                
                // Populate the input features checkboxes
                populateInputFeatures(availableFeatures);
                
                // Populate the target feature dropdown
                populateTargetFeature(availableFeatures);
            }
        } else {
            showNoDataMessage();
        }
    } catch (error) {
        console.error('Error loading data from localStorage:', error);
        showNoDataMessage();
    }
}

/**
 * Show a message when no data is available
 */
function showNoDataMessage() {
    const dataStatusContainer = document.getElementById('dataStatusContainer');
    dataStatusContainer.innerHTML = `
        <div class="alert alert-warning mb-0">
            <h5>No Data Available</h5>
            <p>Please go to Week 2 to load or generate data first.</p>
            <a href="../Week2/" class="btn btn-primary">Go to Week 2</a>
        </div>
    `;
    
    // Disable the model configuration form
    document.getElementById('modelConfigForm').querySelectorAll('input, select, button').forEach(element => {
        element.disabled = true;
    });
}

/**
 * Populate the input features checkboxes
 * @param {Array} features - The available features
 */
function populateInputFeatures(features) {
    const container = document.getElementById('inputFeaturesContainer');
    container.innerHTML = '';
    
    features.forEach(feature => {
        const div = document.createElement('div');
        div.className = 'form-check';
        
        const input = document.createElement('input');
        input.className = 'form-check-input';
        input.type = 'checkbox';
        input.id = `feature-${feature}`;
        input.name = 'inputFeatures';
        input.value = feature;
        input.checked = true; // Default to checked
        
        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = `feature-${feature}`;
        label.textContent = feature;
        
        div.appendChild(input);
        div.appendChild(label);
        container.appendChild(div);
    });
}

/**
 * Populate the target feature dropdown
 * @param {Array} features - The available features
 */
function populateTargetFeature(features) {
    const select = document.getElementById('targetFeature');
    select.innerHTML = '';
    
    features.forEach(feature => {
        const option = document.createElement('option');
        option.value = feature;
        option.textContent = feature;
        select.appendChild(option);
    });
    
    // Set default to 'pm25' or 'aqi' if available
    if (features.includes('pm25')) {
        select.value = 'pm25';
    } else if (features.includes('aqi')) {
        select.value = 'aqi';
    }
}

/**
 * Train the model with the selected configuration
 */
function trainModel() {
    // Get configuration values
    targetFeature = document.getElementById('targetFeature').value;
    predictionHorizon = parseInt(document.getElementById('predictionHorizon').value);
    const modelType = document.getElementById('modelType').value;
    const epochs = parseInt(document.getElementById('epochs').value);
    const batchSize = parseInt(document.getElementById('batchSize').value);
    
    // Get selected input features
    selectedFeatures = [];
    document.querySelectorAll('input[name="inputFeatures"]:checked').forEach(checkbox => {
        selectedFeatures.push(checkbox.value);
    });
    
    // Ensure we don't use the target feature as an input feature
    selectedFeatures = selectedFeatures.filter(feature => feature !== targetFeature);
    
    // Validate configuration
    if (selectedFeatures.length === 0) {
        alert('Please select at least one input feature.');
        return;
    }
    
    // Show the training card
    document.getElementById('trainingCard').style.display = 'block';
    document.getElementById('trainingStatus').innerHTML = '<p>Preparing data for training...</p>';
    document.getElementById('trainingProgress').style.width = '0%';
    document.getElementById('trainingProgress').textContent = '0%';
    
    // Prepare data for training
    prepareDataForTraining().then(() => {
        // Create and compile the model
        createModel(modelType, selectedFeatures.length);
        
        // Train the model
        trainModelWithTensorFlow(epochs, batchSize);
    }).catch(error => {
        console.error('Error preparing data:', error);
        document.getElementById('trainingStatus').innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
    });
}

/**
 * Prepare data for training
 * @returns {Promise} A promise that resolves when data is prepared
 */
async function prepareDataForTraining() {
    return new Promise((resolve, reject) => {
        try {
            if (!airQualityData || airQualityData.length === 0) {
                throw new Error('No data available for training.');
            }
            
            // Sort data by date
            airQualityData.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            // Normalize the data
            normalizeData();
            
            // Create sequences for time series prediction
            createSequences();
            
            resolve();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Normalize the data using z-score normalization
 */
function normalizeData() {
    // Calculate mean and standard deviation for each feature
    dataMeans = {};
    dataStds = {};
    
    // Include target feature in normalization
    const allFeatures = [...selectedFeatures, targetFeature];
    
    allFeatures.forEach(feature => {
        const values = airQualityData.map(item => item[feature]);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
        const std = Math.sqrt(variance);
        
        dataMeans[feature] = mean;
        dataStds[feature] = std;
    });
    
    // Normalize the data
    normalizedData = airQualityData.map(item => {
        const normalizedItem = { date: item.date };
        
        allFeatures.forEach(feature => {
            normalizedItem[feature] = (item[feature] - dataMeans[feature]) / (dataStds[feature] || 1);
        });
        
        return normalizedItem;
    });
    
    console.log('Data normalized:', normalizedData.length, 'records');
}

/**
 * Create sequences for time series prediction
 */
function createSequences() {
    // For simplicity in this prototype, we'll use a simple approach
    // In a real application, we would create proper sequences for LSTM models
    console.log('Sequences created for training');
}

/**
 * Create and compile the TensorFlow.js model
 * @param {string} modelType - The type of model to create
 * @param {number} inputFeatureCount - The number of input features
 */
function createModel(modelType, inputFeatureCount) {
    // Dispose of any existing model to free memory
    if (model) {
        model.dispose();
    }
    
    // Create a new model based on the selected type
    model = tf.sequential();
    
    switch (modelType) {
        case 'dense':
            // Dense neural network
            model.add(tf.layers.dense({
                inputShape: [inputFeatureCount],
                units: 32,
                activation: 'relu'
            }));
            model.add(tf.layers.dense({
                units: 16,
                activation: 'relu'
            }));
            model.add(tf.layers.dense({
                units: 1
            }));
            break;
            
        case 'lstm':
            // LSTM for time series
            // Note: In a real application, we would reshape the input data for LSTM
            model.add(tf.layers.lstm({
                inputShape: [inputFeatureCount, 1],
                units: 32,
                returnSequences: false
            }));
            model.add(tf.layers.dense({
                units: 1
            }));
            break;
            
        case 'linear':
            // Simple linear regression
            model.add(tf.layers.dense({
                inputShape: [inputFeatureCount],
                units: 1
            }));
            break;
    }
    
    // Compile the model
    model.compile({
        optimizer: 'adam',
        loss: 'meanSquaredError',
        metrics: ['meanAbsoluteError']
    });
    
    console.log('Model created:', model.summary());
    document.getElementById('trainingStatus').innerHTML += '<p>Model created and compiled.</p>';
}

/**
 * Train the model using TensorFlow.js
 * @param {number} epochs - The number of training epochs
 * @param {number} batchSize - The batch size for training
 */
async function trainModelWithTensorFlow(epochs, batchSize) {
    try {
        // Prepare the training data
        const splitIndex = Math.floor(normalizedData.length * trainingRatio);
        const trainingData = normalizedData.slice(0, splitIndex);
        const testingData = normalizedData.slice(splitIndex);
        
        console.log(`Training with ${trainingData.length} samples, testing with ${testingData.length} samples`);
        document.getElementById('trainingStatus').innerHTML += `<p>Training with ${trainingData.length} samples, testing with ${testingData.length} samples.</p>`;
        
        // Prepare input and output tensors
        const xTrain = tf.tensor2d(
            trainingData.map(item => selectedFeatures.map(feature => item[feature]))
        );
        const yTrain = tf.tensor2d(
            trainingData.map(item => [item[targetFeature]])
        );
        
        const xTest = tf.tensor2d(
            testingData.map(item => selectedFeatures.map(feature => item[feature]))
        );
        const yTest = tf.tensor2d(
            testingData.map(item => [item[targetFeature]])
        );
        
        // Create a loss chart
        const lossChart = createLossChart();
        
        // Train the model
        await model.fit(xTrain, yTrain, {
            epochs: epochs,
            batchSize: batchSize,
            validationData: [xTest, yTest],
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    // Update progress
                    const progress = Math.round((epoch + 1) / epochs * 100);
                    document.getElementById('trainingProgress').style.width = `${progress}%`;
                    document.getElementById('trainingProgress').textContent = `${progress}%`;
                    
                    // Update status
                    document.getElementById('trainingStatus').innerHTML = `<p>Training epoch ${epoch + 1}/${epochs}</p>`;
                    
                    // Store history
                    trainingHistory.push({
                        epoch: epoch,
                        loss: logs.loss,
                        val_loss: logs.val_loss,
                        mae: logs.meanAbsoluteError,
                        val_mae: logs.val_meanAbsoluteError
                    });
                    
                    // Update loss chart
                    updateLossChart(lossChart, trainingHistory);
                }
            }
        });
        
        // Evaluate the model
        const evalResult = await model.evaluate(xTest, yTest);
        const testLoss = evalResult[0].dataSync()[0];
        const testMAE = evalResult[1].dataSync()[0];
        
        // Display evaluation results
        document.getElementById('trainingStatus').innerHTML = '<p>Training complete!</p>';
        document.getElementById('metricsContainer').innerHTML = `
            <table class="table table-sm">
                <tr>
                    <th>Test Loss (MSE):</th>
                    <td>${testLoss.toFixed(4)}</td>
                </tr>
                <tr>
                    <th>Test MAE:</th>
                    <td>${testMAE.toFixed(4)}</td>
                </tr>
                <tr>
                    <th>Normalized RMSE:</th>
                    <td>${Math.sqrt(testLoss).toFixed(4)}</td>
                </tr>
                <tr>
                    <th>Denormalized MAE:</th>
                    <td>${(testMAE * dataStds[targetFeature]).toFixed(2)} ${getUnitForFeature(targetFeature)}</td>
                </tr>
            </table>
        `;
        
        // Enable the save model and continue buttons
        document.getElementById('saveModelButton').disabled = false;
        document.getElementById('continueToWeek4Button').disabled = false;
        
        // Clean up tensors
        xTrain.dispose();
        yTrain.dispose();
        xTest.dispose();
        yTest.dispose();
        
    } catch (error) {
        console.error('Error training model:', error);
        document.getElementById('trainingStatus').innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
    }
}

/**
 * Create a chart for displaying training loss
 * @returns {Chart} The created chart
 */
function createLossChart() {
    const ctx = document.getElementById('lossChart').getContext('2d');
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Training Loss',
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    data: [],
                    fill: true
                },
                {
                    label: 'Validation Loss',
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    data: [],
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Loss (MSE)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Epoch'
                    }
                }
            }
        }
    });
}

/**
 * Update the loss chart with new training history
 * @param {Chart} chart - The chart to update
 * @param {Array} history - The training history
 */
function updateLossChart(chart, history) {
    chart.data.labels = history.map(item => item.epoch + 1);
    chart.data.datasets[0].data = history.map(item => item.loss);
    chart.data.datasets[1].data = history.map(item => item.val_loss);
    chart.update();
}

/**
 * Save the trained model
 */
async function saveModel() {
    if (!model) {
        alert('No trained model available to save.');
        return;
    }
    
    try {
        // Save the model to localStorage
        const modelInfo = {
            targetFeature: targetFeature,
            selectedFeatures: selectedFeatures,
            dataMeans: dataMeans,
            dataStds: dataStds,
            predictionHorizon: predictionHorizon,
            trainingHistory: trainingHistory,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('airQualityModelInfo', JSON.stringify(modelInfo));
        
        // In a real application, we would save the model weights
        // For this prototype, we'll just simulate it
        document.getElementById('trainingStatus').innerHTML += '<p>Model saved successfully!</p>';
        
        // Enable the continue button
        document.getElementById('continueToWeek4Button').disabled = false;
        
    } catch (error) {
        console.error('Error saving model:', error);
        alert('Error saving model: ' + error.message);
    }
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