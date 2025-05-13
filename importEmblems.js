const fs = require('fs');
const mongoose = require('mongoose');
const Emblem = require('./models/Emblem');

// Stelle sicher, dass du mit MongoDB verbunden bist
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/emblems', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB verbunden'))
  .catch((err) => console.log('Fehler bei der MongoDB-Verbindung:', err));

// Lese die Emblemdaten aus der JSON-Datei
const emblemsData = JSON.parse(fs.readFileSync('./data/emblems.json', 'utf-8'));

// Importiere die Emblemdaten in MongoDB
async function importEmblems() {
  try {
    // Lösche alle existierenden Embleme in der Datenbank
    await Emblem.deleteMany({});

    // Speichere die neuen Embleme in MongoDB
    await Emblem.insertMany(emblemsData);
    console.log('Embleme erfolgreich in MongoDB importiert!');
  } catch (error) {
    console.error('Fehler beim Importieren der Embleme:', error);
  }
}

// Starte den Import
importEmblems();