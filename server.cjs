const http = require('http');
const fs = require('fs');
const path = require('path');
const root = __dirname;
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
  const raw = decodeURIComponent((req.url || '/').split('?')[0]);
  const file = path.resolve(root, raw === '/' ? 'index.html' : '.' + raw);
  if (!file.startsWith(root)) return res.writeHead(403).end('Forbidden');
  fs.readFile(file,(err,data)=>{
    if(err) return res.writeHead(404).end('Not found');
    res.writeHead(200,{'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-cache'});
    res.end(data);
  });
}).listen(process.env.PORT || 4179, '127.0.0.1', ()=>console.log('MD2NN lab: http://127.0.0.1:'+(process.env.PORT || 4179)));
