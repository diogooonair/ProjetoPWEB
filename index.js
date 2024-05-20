const express = require('express');
const path = require('path');

const app = express();


app.use(express.static(path.join(__dirname, 'Paginas')));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Paginas', 'login.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'Paginas', 'login.html'));
});
app.get('/registar', (req, res) => {
  res.sendFile(path.join(__dirname, 'Paginas', 'registo.html'));
});

app.get('/gestao', (req, res) => {
  res.sendFile(path.join(__dirname, 'Paginas', 'gestao.html'));
});


const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
