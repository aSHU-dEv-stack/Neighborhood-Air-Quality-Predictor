// app.js — simple TF.js time-series demo
const statusEl = document.getElementById('status');
const outEl = document.getElementById('output');
const trainBtn = document.getElementById('trainBtn');
const predictBtn = document.getElementById('predictBtn');

const windowSize = 12; // use last 12 readings to predict next
let model = null;
let lastWindow = null;

// create synthetic PM-like data (sine + trend + noise) for demo.
// Replace this array by loading real data later.
function generateSyntheticData(n = 500) {
    const data = [];
    for (let i = 0; i < n; i++) {
        // base seasonal + slow trend + noise
        const seasonal = 10 * Math.sin(i * 2 * Math.PI / 48); // daily-ish cycle
        const trend = 0.02 * i;
        const noise = (Math.random() - 0.5) * 4;
        const value = 30 + seasonal + trend + noise; // example PM2.5 values
        data.push(value);
    }
    return data;
}

// convert raw array into windows and labels
function makeDataset(arr, win = windowSize) {
    const xs = [];
    const ys = [];
    for (let i = 0; i + win < arr.length; i++) {
        xs.push(arr.slice(i, i + win));
        ys.push(arr[i + win]);
    }
    // keep last window for later prediction
    lastWindow = arr.slice(arr.length - win);
    // convert to tensors
    const xTensor = tf.tensor2d(xs); // shape [samples, win]
    const yTensor = tf.tensor2d(ys, [ys.length, 1]);
    return { xTensor, yTensor };
}

// build a small dense model
function buildModel(inputShape) {
    const m = tf.sequential();
    m.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [inputShape] }));
    m.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    m.add(tf.layers.dense({ units: 1 })); // regression
    m.compile({ optimizer: tf.train.adam(0.01), loss: 'meanSquaredError' });
    return m;
}

async function trainDemo() {
    statusEl.innerText = 'Preparing data...';
    const raw = generateSyntheticData(600);
    const { xTensor, yTensor } = makeDataset(raw, windowSize);

    statusEl.innerText = 'Building model...';
    model = buildModel(windowSize);
    model.summary();

    statusEl.innerText = 'Training... (this may take a few seconds)';
    // train — small epochs so it's quick in browser
    await model.fit(xTensor, yTensor, {
        epochs: 40,
        batchSize: 32,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                statusEl.innerText = `Training... epoch ${epoch + 1} loss=${logs.loss.toFixed(3)}`;
            }
        }
    });

    statusEl.innerText = 'Training finished. Click "Predict next value".';
    predictBtn.disabled = false;

    // dispose tensors we don't need
    xTensor.dispose();
    yTensor.dispose();
}

async function predictNext() {
    if (!model || !lastWindow) return;
    // normalize? In this demo we skip normalization for simplicity.
    const input = tf.tensor2d([lastWindow]);
    const pred = model.predict(input);
    const val = (await pred.data())[0];
    outEl.innerText = `Predicted next PM value: ${val.toFixed(2)} μg/m³\nInput window: [${lastWindow.map(v => v.toFixed(1)).join(', ')}]`;
    input.dispose();
    pred.dispose();
}

trainBtn.addEventListener('click', () => {
    trainBtn.disabled = true;
    trainDemo().catch(err => {
        statusEl.innerText = 'Error: ' + err.message;
        trainBtn.disabled = false;
    });
});

predictBtn.addEventListener('click', () => {
    predictNext();
});
