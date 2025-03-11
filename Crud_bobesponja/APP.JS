const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const puerto = 3000;

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "n0m3l0",
  database: "bobesponja_bd"
});

con.connect(err => {
  if (err) {
    console.error("Error al conectar con la base de datos:", err.message);
    return;
  }
  console.log("Conexión exitosa a la base de datos");
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/<\/?[^>]+(>|$)/g, "");
}

function validarCampos(req, res, next) {
  let { nombre, edad, ocupacion, ciudad, color, tipo, habilidad, frase } = req.body;
  
  if (!nombre || !edad || !ocupacion || !ciudad || !color || !tipo || !habilidad || !frase) {
    return res.status(400).send("Todos los campos son obligatorios");
  }
  
  const edadNum = Number(edad);
  if (isNaN(edadNum)) {
    return res.status(400).send("La edad debe ser un número");
  }
  
  req.body.nombre = sanitizeInput(nombre);
  req.body.ocupacion = sanitizeInput(ocupacion);
  req.body.ciudad = sanitizeInput(ciudad);
  req.body.color = sanitizeInput(color);
  req.body.tipo = sanitizeInput(tipo);
  req.body.habilidad = sanitizeInput(habilidad);
  req.body.frase = sanitizeInput(frase);
  req.body.edad = edadNum;
  
  if (req.body.nombre.length > 100 || 
      req.body.ocupacion.length > 100 || 
      req.body.ciudad.length > 100 || 
      req.body.color.length > 50 || 
      req.body.tipo.length > 50 || 
      req.body.habilidad.length > 150 || 
      req.body.frase.length > 255) {
    return res.status(400).send("Uno o más campos exceden la longitud permitida");
  }
  
  next();
}

app.post("/agregarPersonaje", validarCampos, (req, res) => {
  const { nombre, edad, ocupacion, ciudad, color, tipo, habilidad, frase } = req.body;

  con.query(
    "INSERT INTO personaje (nombre, edad, ocupacion, ciudad, color, tipo, habilidad, frase) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [nombre, edad, ocupacion, ciudad, color, tipo, habilidad, frase],
    (err, result) => {
      if (err) {
        console.error("Error al agregar personaje:", err);
        return res.status(500).send("Error al agregar personaje");
      }
      res.status(201).send("Personaje agregado con éxito");
    }
  );
});

app.get("/obtenerPersonajes", (req, res) => {
  con.query("SELECT * FROM personaje", (err, results) => {
    if (err) {
      console.error("Error al obtener personajes:", err);
      return res.status(500).send("Error al obtener personajes");
    }
    res.json(results);
  });
});

app.put("/actualizarPersonaje/:id", validarCampos, (req, res) => {
  const { id } = req.params;
  const { nombre, edad, ocupacion, ciudad, color, tipo, habilidad, frase } = req.body;

  const idNum = Number(id);
  if (isNaN(idNum)) {
    return res.status(400).send("ID inválido");
  }

  con.query(
    "UPDATE personaje SET nombre = ?, edad = ?, ocupacion = ?, ciudad = ?, color = ?, tipo = ?, habilidad = ?, frase = ? WHERE id = ?",
    [nombre, edad, ocupacion, ciudad, color, tipo, habilidad, frase, idNum],
    (err, result) => {
      if (err) {
        console.error("Error al actualizar personaje:", err);
        return res.status(500).send("Error al actualizar personaje");
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).send("Personaje no encontrado");
      }
      
      res.send("Personaje actualizado con éxito");
    }
  );
});

app.delete("/eliminarPersonaje/:id", (req, res) => {
  const { id } = req.params;
  
  const idNum = Number(id);
  if (isNaN(idNum)) {
    return res.status(400).send("ID inválido");
  }

  con.query("DELETE FROM personaje WHERE id = ?", [idNum], (err, result) => {
    if (err) {
      console.error("Error al eliminar personaje:", err);
      return res.status(500).send("Error al eliminar personaje");
    }

    if (result.affectedRows === 0) {
      return res.status(404).send("Personaje no encontrado");
    }

    res.send("Personaje eliminado con éxito");
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('¡Algo salió mal!');
});

app.listen(puerto, () => {
  console.log(`Servidor escuchando en el puerto ${puerto}`);
});