const hostParts = window.location.host.split(':');
const hostname = hostParts[0]; // Extract the hostname
const port = hostParts[1] || '8080'; // Extract the port or use a default (e.g., 8080)
const socketAddress = `ws://${hostname}:${port}/text`; // Use 'wss' for secure WebSocket connections (recommended for external access)
const socket = new WebSocket(socketAddress);

const dataContainer = document.querySelector('#data-container');
const canvas = document.querySelector('#signal-canvas');
const context = canvas.getContext('2d');

var signalToggle = document.getElementById("signal-units-toggle");

canvas.width = canvas.parentElement.clientWidth;

const data = [];
const maxDataPoints = 250;
const pointWidth = (canvas.width - 80) / maxDataPoints;

var europe_programmes = [
    "No PTY", "News", "Current Affairs", "Info",
    "Sport", "Education", "Drama", "Culture", "Science", "Varied",
    "Pop M", "Rock M", "Easy Listening", "Light Classical",
    "Serious Classical", "Other Music", "Weather", "Finance",
    "Children's Programmes", "Social Affairs", "Religion", "Phone-in",
    "Travel", "Leisure", "Jazz Music", "Country Music", "National Music",
    "Oldies Music", "Folk Music", "Documentary", "Alarm Test"
];

// Function to handle zoom in
function zoomIn() {
    zoomMinValue *= 0.9;
    zoomMaxValue *= 0.9;
}

// Function to handle zoom out
function zoomOut() {
    zoomMinValue *= 1.1;
    zoomMaxValue *= 1.1;
}

function getInitialSettings() {
    fetch('/coordinates')
  .then(response => response.json())
  .then(data => {
    // Use the received data (data.qthLatitude, data.qthLongitude) as needed
    localStorage.setItem('qthLatitude', data.qthLatitude);
    localStorage.setItem('qthLongitude', data.qthLongitude);
  })
  .catch(error => console.error('Error:', error));
}

getInitialSettings();

function updateCanvas() {
    // Remove old data when it exceeds the maximum data points

    const color2 = getComputedStyle(document.documentElement).getPropertyValue('--color-2').trim();
    const color4 = getComputedStyle(document.documentElement).getPropertyValue('--color-4').trim();
    
    while (data.length >= maxDataPoints) {
        data.shift();
    }
    // Modify the WebSocket onmessage callback
    socket.onmessage = (event) => {
        const parsedData = JSON.parse(event.data);
        
        updatePanels(parsedData);
        // Push the new signal data to the array
        data.push(parsedData.signal);
        const actualLowestValue = Math.min(...data);
        const actualHighestValue = Math.max(...data);
        zoomMinValue = actualLowestValue - ((actualHighestValue - actualLowestValue) / 2);
        zoomMaxValue = actualHighestValue + ((actualHighestValue - actualLowestValue) / 2);
        zoomAvgValue = (zoomMaxValue - zoomMinValue) / 2 + zoomMinValue;

        // Clear the canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw the signal graph with zoom
        context.beginPath();
        context.moveTo(50, canvas.height - (data[0] - zoomMinValue) * (canvas.height / (zoomMaxValue - zoomMinValue)));
        
        for (let i = 1; i < data.length; i++) {
            const x = i * pointWidth;
            const y = canvas.height - (data[i] - zoomMinValue) * (canvas.height / (zoomMaxValue - zoomMinValue));
            context.lineTo(x + 40, y);
        }
        
        context.strokeStyle = color4;
        context.lineWidth = 1;
        context.stroke();
        
        // Draw horizontal lines for lowest, highest, and average values
        context.strokeStyle = color2; // Set line color
        context.lineWidth = 1;
        
        // Draw the lowest value line
        const lowestY = canvas.height - (zoomMinValue - zoomMinValue) * (canvas.height / (zoomMaxValue - zoomMinValue));
        context.beginPath();
        context.moveTo(40, lowestY - 18);
        context.lineTo(canvas.width - 40, lowestY - 18);
        context.stroke();
        
        // Draw the highest value line
        const highestY = canvas.height - (zoomMaxValue - zoomMinValue) * (canvas.height / (zoomMaxValue - zoomMinValue));
        context.beginPath();
        context.moveTo(40, highestY + 10);
        context.lineTo(canvas.width - 40, highestY + 10);
        context.stroke();

        const avgY = canvas.height / 2;
        context.beginPath();
        context.moveTo(40, avgY - 7);
        context.lineTo(canvas.width - 40, avgY - 7);
        context.stroke();
        
        // Label the lines with their values
        context.fillStyle = color4;
        context.font = '12px Titillium Web';
        
        const offset = signalToggle.checked ? 11.75 : 0;
        context.textAlign = 'right';
        context.fillText(`${(zoomMinValue - offset).toFixed(1)}`, 35, lowestY - 14);
        context.fillText(`${(zoomMaxValue - offset).toFixed(1)}`, 35, highestY + 14);
        context.fillText(`${(zoomAvgValue - offset).toFixed(1)}`, 35, avgY - 3);

        context.textAlign = 'left';
        context.fillText(`${(zoomMinValue - offset).toFixed(1)}`, canvas.width - 35, lowestY - 14);
        context.fillText(`${(zoomMaxValue - offset).toFixed(1)}`, canvas.width - 35, highestY + 14);
        context.fillText(`${(zoomAvgValue - offset).toFixed(1)}`, canvas.width - 35, avgY - 3);
        
        // Update the data container with the latest data
        dataContainer.innerHTML = event.data + '<br>';
    };
    
    requestAnimationFrame(updateCanvas);
}

// Start updating the canvas
updateCanvas();

function compareNumbers(a, b) {
  return a - b;
}

function divideByHundred(a) {
    a = a / 100;
}

function updatePanels(parsedData) {
    // Assuming sortedAf is your array
    const sortedAf = parsedData.af.sort(compareNumbers);

    // Convert the values in the array (dividing by 1000)
    const scaledArray = sortedAf.map(element => element / 1000);

    // Get the container element where you want to display the list
    const listContainer = document.querySelector('#af-list');

    // Preserve the current scroll position
    const scrollTop = listContainer.scrollTop;

    // Get the existing ul element
    const ul = listContainer.querySelector('ul');

    // If ul doesn't exist, create a new one
    if (!ul) {
        ul = document.createElement('ul');
        listContainer.appendChild(ul);
    }

    // Remove existing list items
    ul.innerHTML = '';

    // Create an array of list items
    const listItems = scaledArray.map(element => {
        const li = document.createElement('li');
        li.textContent = element.toFixed(1);
        return li;
    });

    // Append the list items to the unordered list
    listItems.forEach(li => ul.appendChild(li));

    // Restore the scroll position
    listContainer.scrollTop = scrollTop;
    document.querySelector('#data-frequency').textContent = parsedData.freq;
    document.querySelector('#data-pi').innerHTML = parsedData.pi === '?' ? "<span class='text-gray'>?</span>" : parsedData.pi;
    document.querySelector('#data-ps').innerHTML = parsedData.ps === '?' ? "<span class='text-gray'>?</span>" : parsedData.ps;
    document.querySelector('#data-tp').innerHTML = parsedData.tp === false ? "<span class='text-gray'>TP</span>" : "TP";
    document.querySelector('#data-pty').innerHTML = europe_programmes[parsedData.pty];
    document.querySelector('#data-st').innerHTML = parsedData.st === false ? "<span class='text-gray'>ST</span>" : "ST";
    document.querySelector('#data-rt0').innerHTML = parsedData.rt0;
    document.querySelector('#data-rt1').innerHTML = parsedData.rt1;

    document.querySelector('#data-flag').innerHTML = '<i title="' + parsedData.country_name + '" class="flag-sm flag-sm-' + parsedData.country_iso + '"></i>';

    const signalValue = signalToggle.checked ? (parsedData.signal - 11.75) : parsedData.signal;
    const integerPart = Math.floor(signalValue);
    const decimalPart = (signalValue - integerPart).toFixed(1).slice(1); // Adjusted this line
    
    document.querySelector('#data-signal').textContent = integerPart;
    document.querySelector('#data-signal-decimal').textContent = decimalPart;
    document.querySelector('#users-online').textContent = parsedData.users;
}       

signalToggle.addEventListener("change", function() {
    signalText = document.querySelector('#signal-units');
    if (signalToggle.checked) {
        signalText.textContent = 'dBµV';
    } else {
        // Checkbox is unchecked
        signalText.textContent = 'dBf';
    }
});

const textInput = document.getElementById('commandinput');

textInput.addEventListener('change', function (event) {
    const inputValue = textInput.value;
    // Check if the user agent contains 'iPhone'
    if (/iPhone/i.test(navigator.userAgent) && socket.readyState === WebSocket.OPEN) {
        socket.send(inputValue);
            // Clear the input field if needed
    textInput.value = '';
    }
});

textInput.addEventListener('keyup', function (event) {
    // Check if the pressed key is 'Backspace' (key code 8)
    if (event.key !== 'Backspace') {
        // Get the current input value
        let inputValue = textInput.value;

        // Remove non-digit characters (excluding dot)
        inputValue = inputValue.replace(/[^0-9.]/g, '');

        // Remove the last dot if there are two consecutive dots
        if (inputValue.includes("..")) {
            inputValue = inputValue.slice(0, inputValue.lastIndexOf('.')) + inputValue.slice(inputValue.lastIndexOf('.') + 1);
            textInput.value = inputValue;
        }

        // Determine where to add the dot based on the frequency range
        if (!inputValue.includes(".")) {
            if (inputValue.startsWith('10') && inputValue.length > 2) {
                // For frequencies starting with '10', add the dot after the third digit
                inputValue = inputValue.slice(0, 3) + '.' + inputValue.slice(3);
                textInput.value = inputValue;
            } else if (inputValue.length > 2) {
                // For other frequencies, add the dot after the second digit
                inputValue = inputValue.slice(0, 2) + '.' + inputValue.slice(2);
                textInput.value = inputValue;
            }
        }
    }

    // Update the input value

    // Check if the pressed key is 'Enter' (key code 13)
    if (event.key === 'Enter') {
        // Retrieve the input value
        const inputValue = textInput.value;

        // Send the input value to the WebSocket
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(inputValue);
        }

        // Clear the input field if needed
        textInput.value = '';
    }
});

document.onkeydown = checkKey;

function checkKey(e) {
    e = e || window.event;

    getCurrentFreq();

    if (socket.readyState === WebSocket.OPEN) {
        if (e.keyCode == '38') {
                socket.send((currentFreq + 0.01).toFixed(2));
            }
        else if (e.keyCode == '40') {
                socket.send((currentFreq - 0.01).toFixed(2));
        }
        else if (e.keyCode == '37') {
                socket.send((currentFreq - 0.10).toFixed(1));
        }
        else if (e.keyCode == '39') {
            socket.send((currentFreq + 0.10).toFixed(1));
        }
    }
}

function getCurrentFreq() {
    currentFreq = document.getElementById("data-frequency").textContent;
    currentFreq = parseFloat(currentFreq).toFixed(3);
    currentFreq = parseFloat(currentFreq);

    return currentFreq;
}

freqUpButton = document.getElementById('freq-up');
freqDownButton = document.getElementById('freq-down');
psContainer = document.getElementById('ps-container');
piCodeContainer = document.getElementById('pi-code-container');
freqContainer = document.getElementById('freq-container');

freqUpButton.addEventListener("click", tuneUp);
freqDownButton.addEventListener("click", tuneDown);
psContainer.addEventListener("click", copyPs);
piCodeContainer.addEventListener("click", findOnMaps);
freqContainer.addEventListener("click", function() {
    textInput.focus();
});

function tuneUp() {
    if (socket.readyState === WebSocket.OPEN) {
        getCurrentFreq();
        socket.send((currentFreq + 0.10).toFixed(1));
    }
}

function tuneDown() {
    if (socket.readyState === WebSocket.OPEN) {
        getCurrentFreq();
        socket.send((currentFreq - 0.10).toFixed(1));
    }
}

async function copyPs() {
    let frequency = document.querySelector('#data-frequency').textContent;
    let pi = document.querySelector('#data-pi').textContent;
    let ps = document.querySelector('#data-ps').textContent;
    let signal = document.querySelector('#data-signal').textContent;
    let signalDecimal = document.querySelector('#data-signal-decimal').textContent;
    let signalUnit = document.querySelector('#signal-units').textContent;
    try {
        await copyToClipboard(frequency + " - " + pi + " | " + ps +  " [" + signal + signalDecimal + " " + signalUnit + "]");
    } catch(error) {
        console.error(error);
    }
}

function findOnMaps() {
    let frequency = document.querySelector('#data-frequency').textContent;
    let pi = document.querySelector('#data-pi').textContent;
    let latitude = localStorage.getItem('qthLongitude');
    let longitude = localStorage.getItem('qthLatitude');
    frequency = parseFloat(frequency).toFixed(1);
    window.open("https://maps.fmdx.pl/#qth=" + longitude + "," + latitude + "&freq=" + frequency + "&pi=" + pi, "_blank");
}

async function copyToClipboard(textToCopy) {
    // Navigator clipboard api needs a secure context (https)
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
            
        document.body.prepend(textArea);
        textArea.select();

        try {
            document.execCommand('copy');
        } catch (error) {
            console.error(error);
        } finally {
            textArea.remove();
        }
    }
}