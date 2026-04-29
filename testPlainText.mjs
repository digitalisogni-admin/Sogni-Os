import http from 'http';

const data = JSON.stringify({
  "name": "No CORS Tester",
  "email": "test@test.com",
  "apiKey": "sh_live_oqt7auewqf87wec71jtbw"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/leads/capture',
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, res => {
  let responseBody = '';
  res.on('data', chunk => responseBody += chunk);
  res.on('end', () => console.log('Response:', responseBody));
});

req.on('error', error => {
  console.error('Error:', error);
});

req.write(data);
req.end();
