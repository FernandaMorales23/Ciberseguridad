const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcryptjs");

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
        process.exit(1);
    }
    console.log("Conexión exitosa a la base de datos");
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
    secret: "bobesponja123",
    resave: false,
    saveUninitialized: false
}));

function autenticar(req, res, next) {
    if (!req.session.usuario) return res.status(401).send("Debes iniciar sesión");
    next();
}

app.post("/register", (req, res) => {
    const { usuario, password } = req.body;
    if (!usuario || !password) return res.status(400).send("Datos incompletos");
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    con.query("SELECT * FROM usuarios WHERE usuario = ?", [usuario], (err, resultados) => {
        if (err) return res.status(500).send("Error en la base de datos");
        if (resultados.length > 0) return res.status(400).send("El usuario ya existe");
        
        con.query("INSERT INTO usuarios (usuario, password) VALUES (?, ?)", [usuario, hashedPassword], (err) => {
            if (err) return res.status(500).send("Error al registrar usuario");
            res.send("Usuario registrado exitosamente");
        });
    });
});

app.post("/login", (req, res) => {
    const { usuario, password } = req.body;
    if (!usuario || !password) return res.status(400).send("Datos incompletos");
   
    con.query("SELECT * FROM usuarios WHERE usuario = ?", [usuario], (err, resultados) => {
        if (err) return res.status(500).send("Error en la base de datos");
        if (resultados.length > 0) {
            const valid = bcrypt.compareSync(password, resultados[0].password);
            if (valid) {
                req.session.usuario = usuario;
                return res.send("Login exitoso");
            }
        }
        res.status(401).send("Usuario o contraseña incorrectos");
    });
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.send("Sesión cerrada");
});

app.post("/agregarPersonaje", autenticar, (req, res) => {
    const { nombre, edad, ocupacion, ciudad, color, tipo, habilidad, frase } = req.body;
    
    if (!nombre || !edad || !ocupacion || !ciudad || !color || !tipo || !habilidad || !frase) {
        return res.status(400).send("Todos los campos son obligatorios");
    }

    const edadNum = parseInt(edad);
    if (isNaN(edadNum)) {
        return res.status(400).send("La edad debe ser un número válido");
    }

    const sql = "INSERT INTO personaje (nombre, edad, ocupacion, ciudad, color, tipo, habilidad, frase) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    
    con.query(sql, [nombre, edadNum, ocupacion, ciudad, color, tipo, habilidad, frase], (err, result) => {
        if (err) {
            console.error("Error al agregar personaje:", err.sqlMessage);
            return res.status(500).send("Error al agregar personaje: " + err.sqlMessage);
        }
        res.send("Personaje agregado con éxito");
    });
});

app.get("/obtenerPersonajes", autenticar, (req, res) => {
    con.query("SELECT * FROM personaje", (err, results) => {
        if (err) return res.status(500).send("Error al obtener personajes");
        res.json(results);
    });
});

app.put("/actualizarPersonaje/:id", autenticar, (req, res) => {
    const { id } = req.params;
    const { nombre, edad, ocupacion, ciudad, color, tipo, habilidad, frase } = req.body;
    
    con.query("UPDATE personaje SET ? WHERE id = ?", [{ nombre, edad, ocupacion, ciudad, color, tipo, habilidad, frase }, id],
        (err, result) => {
            if (err) return res.status(500).send("Error al actualizar");
            if (result.affectedRows === 0) return res.status(404).send("No encontrado");
            res.send("Actualizado con éxito");
        }
    );
});

app.delete("/eliminarPersonaje/:id", autenticar, (req, res) => {
    const { id } = req.params;
    
    con.query("DELETE FROM personaje WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).send("Error al eliminar");
        if (result.affectedRows === 0) return res.status(404).send("No encontrado");
        res.send("Eliminado con éxito");
    });
});

app.listen(puerto, () => {
    console.log(`Servidor escuchado en el puerto:${puerto}`);
});