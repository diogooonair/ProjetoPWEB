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

const pecaSchema = new mongoose.Schema({
  nome: String,
  quantidade: Number
});

const montagemSchema = new mongoose.Schema({
  modeloDrone: String,
  pecasNecessarias: [String] // Array de IDs de peças
});

const User = mongoose.model('User', userSchema);
const Peca = mongoose.model('Peca', pecaSchema);
const Montagem = mongoose.model('Montagem', montagemSchema);

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

app.get('/registo', (req, res) => {
  const user = req.cookies.user;
  if (user) {
    return res.redirect('/gestao');
  }
  res.sendFile(path.join(__dirname, 'Paginas', 'registo.html'));
});

app.post('/registar', async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username: username });
    if (existingUser) {
      return res.status(400).send('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      username: username,
      password: hashedPassword,
    });

    // Save the user to the database
    await newUser.save();
    res.status(201).send('Utilizador Rgistado COm SUcesso');
  } catch (error) {
    console.error('Erro ao registar user:', error);
    res.status(500).send('Erro interno');
  }
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

// Rota para obter a lista de peças
app.get('/pecas', async (req, res) => {
  try {
    const pecas = await Peca.find();
    res.json(pecas);
  } catch (error) {
    console.error('Erro ao obter peças:', error);
    res.status(500).send('Erro interno');
  }
});

// Rota para adicionar uma nova peça
app.post('/pecas', async (req, res) => {
  const { nome, quantidade } = req.body;
  
  try {
    const novaPeca = new Peca({
      nome: nome,
      quantidade: quantidade
    });
    
    await novaPeca.save();
    res.status(201).send('Peça adicionada com sucesso');
  } catch (error) {
    console.error('Erro ao adicionar peça:', error);
    res.status(500).send('Erro interno');
  }
});

// Rota para adicionar uma nova montagem
app.post('/montagens', async (req, res) => {
  const { modeloDrone, pecasNecessarias } = req.body;
  
  try {
    const novaMontagem = new Montagem({
      modeloDrone: modeloDrone,
      pecasNecessarias: pecasNecessarias
    });
    
    await novaMontagem.save();
    res.status(201).send('Montagem adicionada com sucesso');
  } catch (error) {
    console.error('Erro ao adicionar montagem:', error);
    res.status(500).send('Erro interno');
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
