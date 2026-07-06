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
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Fonction pour censurer les mots vulgaires
function censurerTexte(texte) {
  const motsVulgaires = [
    "merde",
    "putain",
    "pute",
    "connard",
    "connasse",
    "con",
    "salope",
    "enculé",
    "encule",
    "fdp",
    "bite",
    "couille",
    "couilles",
    "nique",
    "niquer",
    "ta gueule",
    "tg",
    "bordel"
  ];

  let texteCensure = texte || "";

  motsVulgaires.forEach(mot => {
    const motProtege = mot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const regex = new RegExp(
      `(^|[^a-zA-ZÀ-ÿ])(${motProtege})(?=$|[^a-zA-ZÀ-ÿ])`,
      "gi"
    );

    texteCensure = texteCensure.replace(regex, (match, avant, motTrouve) => {
      return avant + "*".repeat(motTrouve.length);
    });
  });

  return texteCensure;
}

app.post("/envoyer", upload.single("photo"), async (req, res) => {
  try {
    const {
      nom,
      prenom,
      age,
      consentement,
      consentementTest,
      peau,
      longueur,
      densite,
      texture,
      frequence,
      avis
    } = req.body;

    if (consentementTest !== "Oui") {
      return res.status(400).send("Le consentement au test gratuit est obligatoire.");
    }

    const avisCensure = censurerTexte(avis);

    const questionnaire = `
QUESTIONNAIRE HUILE POUR BARBE - LUHAYRA

Nom : ${nom}
Prénom : ${prenom}
Âge : ${age} ans

Consentement au sondage : ${consentement || "Non"}

Consentement au test gratuit :
${consentementTest}

Type de peau : ${peau}

Type de barbe :
- Longueur : ${longueur}
- Densité : ${densite}
- Texture : ${texture}

Fréquence d'utilisation de l'huile pour barbe : ${frequence}

Avis / critique :
${avisCensure}
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
