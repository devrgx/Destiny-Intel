const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");
const path = require('path');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB-Verbindung herstellen
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/emblems", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB verbunden"))
  .catch((err) => {
    console.error("❌ MongoDB Fehler:", err);
    process.exit(1);
  });

// Body Parser aktivieren
app.use(express.json());

// 🔗 Routen einbinden
const emblemRoutes = require("./routes/emblem");
const pingRoute = require("./routes/ping");
const authRoutes = require("./routes/auth");

app.use("/emblem", emblemRoutes);
app.use("/ping", pingRoute);
app.use("/", authRoutes);

// 📘 Swagger-Doku konfigurieren
const swaggerSpec = swaggerJSDoc({
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "D2 Emblem API",
      version: "1.0.0",
      description: "API zur Anzeige von Destiny 2 Emblemen",
    },
    servers: [
      { url: "https://api.d2emblem.info" },
      { url: "http://localhost:3000" },
    ],
  },
  apis: ["./routes/*.js"], // Swagger-Doku aus Routen
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const bungieRoutes = require("./routes/bungie");
app.use("/bungie", bungieRoutes);

const userRoutes = require("./routes/users");
app.use("/users", userRoutes);

app.use('/cdn/ranks', express.static(path.join(__dirname, '../bot/data/cdn/ranks')));

// 🚀 Server starten
app.listen(PORT, () => {
  console.log(`🚀 API läuft unter http://localhost:${PORT}`);
});