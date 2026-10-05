'use strict';

const LANGUAGES = Object.freeze({
  jawa: 'Bahasa Jawa Krama Inggil yang halus dan sopan untuk berbicara dengan orang tua',
  sunda: 'Bahasa Sunda Lemes (halus) yang sopan untuk orang tua',
  minang: 'Bahasa Minangkabau yang sopan',
  batak: 'Bahasa Batak Toba yang sopan',
});

const LANGUAGE_IDS = Object.freeze(Object.keys(LANGUAGES));

const buildTranslatePrompt = (language) => `Anda adalah penerjemah ahli bahasa daerah Indonesia. Tugas Anda menerjemahkan template balasan WhatsApp ke ${LANGUAGES[language]}.

PENTING: JANGAN sertakan emoji apapun. Pertahankan struktur 3 template (sopan, santai, humor) dan nuansa aslinya. Output JSON murni dengan struktur:
{
  "politeReplies": {
    "sopan": "Terjemahan template sopan ke bahasa target",
    "santai": "Terjemahan template santai ke bahasa target",
    "humor": "Terjemahan template humor ke bahasa target"
  }
}`;

module.exports = { LANGUAGE_IDS, buildTranslatePrompt };
