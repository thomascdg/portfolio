const path = require('path');
require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
const port = Number(process.env.PORT || 3000);
const recipientEmail = process.env.CONTACT_TO;

app.use(express.json());
app.use(express.static(__dirname));

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const portValue = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || 'false') === 'true';

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: portValue,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Tous les champs sont obligatoires.' });
  }

  if (!recipientEmail) {
    return res.status(500).json({ error: 'L’adresse de réception n’est pas configurée.' });
  }

  const transporter = createTransporter();
  if (!transporter) {
    return res.status(500).json({
      error:
        'Le serveur mail n’est pas configuré. Renseigne SMTP_HOST, SMTP_PORT, SMTP_USER et SMTP_PASS.',
    });
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipientEmail,
      replyTo: email,
      subject: `Nouveau message portfolio de ${name}`,
      text: `Nom et prénom: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <h2>Nouveau message depuis le portfolio</h2>
        <p><strong>Nom et prénom:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, '<br />')}</p>
      `,
    });

    return res.json({ message: 'Message envoyé avec succès.' });
  } catch (error) {
    console.error('Failed to send mail:', error);
    return res.status(500).json({
      error: 'Impossible d’envoyer le message.',
      details: error?.message || 'Erreur SMTP inconnue',
    });
  }
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Portfolio server running on http://localhost:${port}`);
});

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
