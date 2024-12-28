const express = require("express");
const multer = require("multer");
const fs = require("fs");
const mammoth = require("mammoth");

const app = express();
const upload = multer({ dest: "uploads/" }); // Diretório temporário para uploads

// Middleware para servir arquivos estáticos (HTML e JS)
app.use(express.static(__dirname));

// Endpoint para receber upload
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;

    // Extrair texto do arquivo Word
    const { value: text } = await mammoth.extractRawText({ path: filePath });

    // Processar o texto e convertê-lo para JSON
    const lines = text.split("\n").map(line => line.trim()).filter(line => line);
    const jsonResult = parseDocumentToJSON(lines);

    // Remover o arquivo temporário
    fs.unlinkSync(filePath);

    // Retornar o JSON gerado
    res.json(jsonResult);
  } catch (error) {
    console.error("Erro ao processar o arquivo:", error);
    res.status(500).json({ error: "Erro ao processar o arquivo" });
  }
});

// Função para converter texto em JSON estruturado
function parseDocumentToJSON(lines) {
  const jsonData = {};
  let currentSection = null;

  lines.forEach(line => {
    if (line.startsWith("Cap.")) {
      currentSection = line;
      jsonData[currentSection] = [];
    } else if (currentSection) {
      jsonData[currentSection].push(line);
    }
  });

  return jsonData;
}

// Iniciar o servidor
const PORT = process.env.PORT || 3000; // Porta definida pelo ambiente ou 3000
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
