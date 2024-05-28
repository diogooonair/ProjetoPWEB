const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');

const app = express();
const saltRounds = 10;

mongoose.connect('mongodb+srv://diogoonair:diogo218@cluster0.inc4ftn.mongodb.net/myDatabase', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Conectado ao MongoDB');
  })
  .catch(err => console.error('Erro ao conectar MongoDB:', err));

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

app.use(express.static(path.join(__dirname, 'Paginas')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    const user = req.cookies.user;
     if (user) {
       return res.redirect('/gestao');
     }
      
      

     res.redirect('/login');
});

app.get('/login', (req, res) => {
    const user = req.cookies.user;
     if (user) {
       return res.redirect('/gestao');
     }
      
      

     res.sendFile(path.join(__dirname, 'Paginas', 'login.html'));
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username: username });
    if (!user) {
      return res.status(400).send('Credenciais inválidas');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).send('Credenciais inválidas');
    }

    res.cookie('user', username, { maxAge: 3600000 });
    res.redirect('/gestao');
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).send('Erro interno');
  }
});

app.get('/gestao', (req, res) => {
  const user = req.cookies.user;
  if (!user) {
    return res.status(401).send('Acesso não autorizado');
  }
  
  res.sendFile(path.join(__dirname, 'Paginas', 'gestao.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
