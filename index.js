const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');

const app = express();
const saltRounds = 10;

mongoose.connect('mongodb+srv://diogoonair:diogo218@cluster0.inc4ftn.mongodb.net/Projeto', { useNewUrlParser: true, useUnifiedTopology: true })
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

app.get('/logout', (req, res) => {
  res.clearCookie('user');
  res.redirect('/login');
});

app.get('/registar', (req, res) => {
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

    await newUser.save();
    res.status(201).send('Utilizador Registado com Sucesso');
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

app.get('/pecas', async (req, res) => {
  try {
    const pecas = await Peca.find();
    res.json(pecas);
  } catch (error) {
    console.error('Erro ao obter peças:', error);
    res.status(500).send('Erro interno');
  }
});

app.post('/pecas', async (req, res) => {
  const { nome, quantidade } = req.body;

  try {
    let pecaExistente = await Peca.findOne({ nome: nome });

    if (pecaExistente) {
      // Se a peça já existe, atualize a quantidade
      pecaExistente.quantidade += quantidade;
      await pecaExistente.save();
      res.status(200).send('Quantidade da peça atualizada com sucesso');
    } else {
      // Se a peça não existe, crie uma nova entrada
      const novaPeca = new Peca({
        nome: nome,
        quantidade: quantidade
      });
      await novaPeca.save();
      res.status(201).send('Peça adicionada com sucesso');
    }
  } catch (error) {
    console.error('Erro ao adicionar/atualizar peça:', error);
    res.status(500).send('Erro interno');
  }
});

app.get('/estatisticas/pecas', async (req, res) => {
  try {
    const pecas = await Peca.find();
    res.json(pecas);
  } catch (error) {
    console.error('Erro ao obter estatísticas das peças:', error);
    res.status(500).send('Erro interno');
  }
});

app.get('/estatisticas/montagens', async (req, res) => {
  try {
    const montagens = await Montagem.find();
    res.json(montagens);
  } catch (error) {
    console.error('Erro ao obter estatísticas das montagens:', error);
    res.status(500).send('Erro interno');
  }
});

app.put('/pecas/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, quantidade } = req.body;

  try {
    const peca = await Peca.findByIdAndUpdate(id, { nome, quantidade }, { new: true });
    res.json(peca);
  } catch (error) {
    console.error('Erro ao editar peça:', error);
    res.status(500).send('Erro interno');
  }
});

app.delete('/pecas/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await Peca.findByIdAndDelete(id);
    res.status(200).send('Peça deletada com sucesso');
  } catch (error) {
    console.error('Erro ao deletar peça:', error);
    res.status(500).send('Erro interno');
  }
});

app.post('/montagens', async (req, res) => {
  const { modeloDrone, pecasNecessarias } = req.body;

  const novaMontagem = new Montagem({ modeloDrone, pecasNecessarias });

  try {
    await novaMontagem.save();
    res.status(201).send('Montagem adicionada com sucesso');
  } catch (err) {
    res.status(400).send('Erro ao adicionar montagem');
  }
});

app.post('/montagens/:id/completar', async (req, res) => {
  const { id } = req.params;

  try {
    const montagem = await Montagem.findById(id);
    if (!montagem) {
      return res.status(404).send('Montagem não encontrada');
    }

    for (const pecaId of montagem.pecasNecessarias) {
      const peca = await Peca.findById(pecaId);
      if (!peca) {
        return res.status(404).send('Peça não encontrada');
      }
      peca.quantidade -= 1;
      if (peca.quantidade < 0) {
        return res.status(400).send('Quantidade insuficiente de peças');
      }
      await peca.save();
    }

    await montagem.remove();
    res.send('Montagem completada com sucesso');
  } catch (err) {
    res.status(500).send('Erro ao completar montagem');
  }
});

app.put('/montagens/:id', async (req, res) => {
  const { id } = req.params;
  const { modeloDrone, pecasNecessarias } = req.body;

  try {
    const montagem = await Montagem.findByIdAndUpdate(id, { modeloDrone, pecasNecessarias }, { new: true });
    res.json(montagem);
  } catch (error) {
    console.error('Erro ao editar montagem:', error);
    res.status(500).send('Erro interno');
  }
});

app.delete('/montagens/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await Montagem.findByIdAndDelete(id);
    res.status(200).send('Montagem deletada com sucesso');
  } catch (error) {
    console.error('Erro ao deletar montagem:', error);
    res.status(500).send('Erro interno');
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
