import http from 'http';

const data = JSON.stringify({
  "name": "Jean Dupont",
  "email": "jean@exemple.com",
  "phone": "+33 6 00 00 00 00",
  "website": "www.son-site.com",
  "business": "Nom de son entreprise",
  "message": "Son message...",
  "apiKey": "sh_live_oqt7auewqf87wec71jtbw",
  "pageSubject": "Sogni Digitali Form",
  "source": "Sogni Digitali Website",
  "createdAt": "2026-04-20T10:00:00.000Z"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/leads/capture',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
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
