const http = require('http');

const req = http.request('http://127.0.0.1:3000/api/orders/delivery/ecotrack', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, res => {
  let data = '';
  res.on('data', c => data+=c);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'DATA:', data));
});
req.write(JSON.stringify({ orderIds: [1] }));
req.end();
