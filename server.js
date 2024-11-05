const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

// Configuração do MongoDB Atlas
const mongoURI = 'mongodb+srv://arthurwarken13:Y6sudIhqUtij1jFP@cluster0.f0mm2dl.mongodb.net/chatbot?retryWrites=true&w=majority';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

const conversationSchema = new mongoose.Schema({
  userId: String,
  messages: [{
    sender: String,
    text: String,
    timestamp: { type: Date, default: Date.now }
  }]
});

const loginSchema = new mongoose.Schema({
  userId: String,
  timestamp: { type: Date, default: Date.now },
  ip: String
});

const Conversation = mongoose.model('Conversation', conversationSchema);
const Login = mongoose.model('Login', loginSchema);

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Rota para salvar histórico de conversas do chatbot
app.post('/api/history', async (req, res) => {
  const { userId, userMessage, aiResponse, timestamp } = req.body;

  if (!userMessage || !aiResponse || !timestamp) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }

  try {
    const novaConversa = await Conversation.findOneAndUpdate(
      { userId },
      { $push: { messages: { sender: 'usuário', text: userMessage, timestamp } } },
      { new: true, upsert: true }
    );

    // Salvando resposta da IA na conversa
    novaConversa.messages.push({ sender: 'IA', text: aiResponse, timestamp });
    await novaConversa.save();

    res.json({ message: 'Histórico salvo com sucesso', novaConversa });
  } catch (error) {
    console.error('Erro ao salvar histórico:', error);
    res.status(500).json({ error: 'Erro ao salvar histórico' });
  }
});

// Rota para registrar login
app.post('/api/login', async (req, res) => {
  const { userId, ip } = req.body;

  if (!userId || !ip) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }

  try {
    const novoLogin = new Login({ userId, ip });
    await novoLogin.save();
    res.json({ message: 'Login registrado com sucesso!' });
  } catch (error) {
    console.error('Erro ao registrar login:', error);
    res.status(500).json({ error: 'Erro ao registrar login' });
  }
});

// Rota para recuperar histórico de conversas
app.get('/api/conversas/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const conversas = await Conversation.find({ userId });

    if (conversas.length > 0) {
      res.json(conversas);
    } else {
      res.status(404).json({ message: 'Nenhuma conversa encontrada para este usuário.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar conversas.' });
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
