const http = require("http");

const PORT = process.env.PORT || 3000;

const html = `
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>DNPXIA</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      background: #0b1020;
      color: #f5f7fb;
      display: grid;
      place-items: center;
      min-height: 100vh;
    }
    .box {
      max-width: 720px;
      padding: 32px;
      border-radius: 18px;
      background: #121935;
      box-shadow: 0 10px 30px rgba(0,0,0,.35);
    }
    h1 { margin-top: 0; font-size: 42px; }
    p { line-height: 1.5; color: #d3dbef; }
    .tag {
      display: inline-block;
      padding: 8px 12px;
      border-radius: 999px;
      background: #1f2a56;
      color: #9fc0ff;
      font-size: 14px;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="box">
    <div class="tag">DNPXIA · fase 0</div>
    <h1>Infraestructura lista</h1>
    <p>Docker, web, api y base de datos están levantados.</p>
    <p>Siguiente paso: autenticación, multi-tenant, suscripciones y panel autogestionado.</p>
  </div>
</body>
</html>
`;

const server = http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
});

server.listen(PORT, () => {
  console.log(`DNPXIA WEB running on port ${PORT}`);
});
