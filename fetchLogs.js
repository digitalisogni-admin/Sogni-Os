import http from 'http';

http.get('http://localhost:3000/api/debug/logs', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const logs = JSON.parse(data).logs;
      console.log(logs.slice(-20).join('\n'));
    } catch (e) {
      console.log(data);
    }
  });
}).on('error', err => {
  console.log('Error: ', err.message);
});
