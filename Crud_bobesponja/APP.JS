const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const puerto = 8000;

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

// Función para limpiar entradas de usuario
function sanitizeInput(input) {
return input.trim().replace(/<\/?[^>]+(>|$)/g, ""); // Elimina etiquetas HTML
}

// Crear personaje con validaciones
app.post("/agregarPersonaje", (req, res) => {
let { nombre, edad, ocupacion, ciudad, color, tipo, habilidad, frase } = req.body;

// Sanitizar los datos
nombre = sanitizeInput(nombre);
ocupacion = sanitizeInput(ocupacion);
ciudad = sanitizeInput(ciudad);
color = sanitizeInput(color);
tipo = sanitizeInput(tipo);
habilidad = sanitizeInput(habilidad);
frase = sanitizeInput(frase);

if (!nombre || !edad || !ocupacion || !ciudad || !color || !tipo || !habilidad || !frase) {
return res.status(400).send("Todos los campos son obligatorios");
}

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

// Obtener personajes
app.get("/obtenerPersonajes", (req, res) => {
con.query("SELECT * FROM personaje", (err, results) => {
if (err) {
console.error("Error al obtener personajes:", err);
return res.status(500).send("Error al obtener personajes");
}
res.json(results);
});
});

// Actualizar personaje
app.put("/actualizarPersonaje/:id", (req, res) => {
const { id } = req.params;
let { nombre, edad, ocupacion, ciudad, color, tipo, habilidad, frase } = req.body;

// Sanitizar los datos
nombre = sanitizeInput(nombre);
ocupacion = sanitizeInput(ocupacion);
ciudad = sanitizeInput(ciudad);
color = sanitizeInput(color);
tipo = sanitizeInput(tipo);
habilidad = sanitizeInput(habilidad);
frase = sanitizeInput(frase);

if (!nombre || !edad || !ocupacion || !ciudad || !color || !tipo || !habilidad || !frase) {
return res.status(400).send("Todos los campos son obligatorios");
}

con.query(
"UPDATE personaje SET nombre = ?, edad = ?, ocupacion = ?, ciudad = ?, color = ?, tipo = ?, habilidad = ?, frase = ? WHERE id = ?",
[nombre, edad, ocupacion, ciudad, color, tipo, habilidad, frase, id],
(err, result) => {
if (err) {
console.error("Error al actualizar personaje:", err);
return res.status(500).send("Error al actualizar personaje");
}
res.send("Personaje actualizado con éxito");
}
);
});

// Eliminar personaje
app.delete("/eliminarPersonaje/:id", (req, res) => {
const { id } = req.params;

con.query("DELETE FROM personaje WHERE id = ?", [id], (err, result) => {
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

app.listen(3000, () => {
console.log(`Servidor escuchando en el puerto 3000`);
});