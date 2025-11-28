// 1. FETCH API DATA 
async function fetchServerInfo() {
    try {
        const response = await fetch('/api/agent-info');
        const data = await response.json();
        if (data.os) {
            document.getElementById('server-info').innerHTML =
                `<strong>OS:</strong> ${data.os} ${data.release} <br> 
                     <strong>Node:</strong> ${data.node} <br>
                     <strong>Processor:</strong> ${data.processor}`;
        } else {
            document.getElementById('server-info').innerText = "No Agent Registered yet.";
        }
    } catch (error) {
        console.error('Error fetching API:', error);
    }
}
// Panggil API setiap 5 detik (Polling metadata)
fetchServerInfo();
setInterval(fetchServerInfo, 5000);

// 2. SETUP CHART.JS
const ctx = document.getElementById('liveChart').getContext('2d');
const liveChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'CPU Usage (%)',
            borderColor: '#f38ba8',
            backgroundColor: 'rgba(243, 139, 168, 0.2)',
            data: [],
            fill: true,
            tension: 0.4
        }, {
            label: 'RAM Usage (%)',
            borderColor: '#89b4fa',
            backgroundColor: 'rgba(137, 180, 250, 0.2)',
            data: [],
            fill: true,
            tension: 0.4
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                max: 100
            }
        },
        animation: {
            duration: 0
        } // Matikan animasi agar gerakan realtime mulus
    }
});

// 3. SETUP WEBSOCKET
const socket = io();

socket.on('connect', () => {
    document.getElementById('conn-status').innerText = "Connected (WebSocket Active)";
    document.getElementById('conn-status').style.color = "#a6e3a1";
});

socket.on('disconnect', () => {
    document.getElementById('conn-status').innerText = "Disconnected";
    document.getElementById('conn-status').style.color = "#f38ba8";
});

// Menerima data broadcast dari server
socket.on('update_dashboard', (data) => {
    document.getElementById('cpu-val').innerText = data.cpu + '%';
    document.getElementById('ram-val').innerText = data.ram + '%';

    // Update Chart
    const timeNow = data.timestamp;

    if (liveChart.data.labels.length > 20) { // Simpan hanya 20 data terakhir
        liveChart.data.labels.shift();
        liveChart.data.datasets[0].data.shift();
        liveChart.data.datasets[1].data.shift();
    }

    liveChart.data.labels.push(timeNow);
    liveChart.data.datasets[0].data.push(data.cpu);
    liveChart.data.datasets[1].data.push(data.ram);
    liveChart.update();
});