const express = require("express");
const nodemailer = require("nodemailer");
const multer = require("multer");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());

// Permet d’ouvrir index.html directement depuis le serveur
app.use(express.static(__dirname));

app.post("/envoyer", upload.single("photo"), async (req, res) => {
  try {
    const {
      nom,
      prenom,
      age,
      consentement,
      peau,
      longueur,
      densite,
      texture,
      frequence,
      avis
    } = req.body;

    const questionnaire = `
QUESTIONNAIRE HUILE POUR BARBE - LUHAYRA

Nom : ${nom}
Prénom : ${prenom}
Âge : ${age} ans

Consentement : ${consentement || "Non"}

Type de peau : ${peau}

Type de barbe :
- Longueur : ${longueur}
- Densité : ${densite}
- Texture : ${texture}

Fréquence d'utilisation de l'huile pour barbe : ${frequence}

Avis / critique :
${avis}
`;

    const piecesJointes = [
      {
        filename: `questionnaire-${nom}-${prenom}.txt`,
        content: questionnaire
      }
    ];

    if (req.file) {
      piecesJointes.push({
        filename: req.file.originalname,
        content: req.file.buffer,
        contentType: req.file.mimetype
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "luhayra.boutique@gmail.com",
      subject: "questionnaire",
      text: `Bonjour ${nom} ${prenom},

Vous trouverez mes réponses ci-joint.

Cordialement,

${prenom} ${nom}`,
      attachments: piecesJointes
    });

    res.status(200).send("Questionnaire envoyé");
  } catch (error) {
    console.error("Erreur complète :", error);
    res.status(500).send("Erreur lors de l'envoi du mail");
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});