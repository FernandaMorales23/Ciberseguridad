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
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // 1 hora
}));

// Middleware para proteger rutas
function autenticar(req, res, next) {
    if (!req.session.usuario) return res.status(401).send("Debes iniciar sesión");
    next();
}

// Middleware para verificar propiedad del personaje
function verificarPropietario(req, res, next) {
    if (!req.session.usuario) return res.status(401).send("Debes iniciar sesión");
    
    const { id } = req.params;
    
    con.query("SELECT * FROM personaje WHERE id = ?", [id], (err, resultados) => {
        if (err) return res.status(500).send("Error en la base de datos");
        if (resultados.length === 0) return res.status(404).send("Personaje no encontrado");
        
        const personaje = resultados[0];
        
        // Verificar si el usuario actual es el creador del personaje
        if (personaje.creador !== req.session.usuario) {
            return res.status(403).send("No tienes permiso para modificar este personaje. Solo el creador puede editarlo o eliminarlo.");
        }
        
        next();
    });
}

// Ruta para verificar si hay una sesión activa
app.get("/check-session", (req, res) => {
    if (req.session.usuario) {
        return res.status(200).send("Sesión activa");
    } else {
        return res.status(401).send("No hay sesión activa");
    }
});

// Ruta para obtener el usuario actual
app.get("/usuario-actual", (req, res) => {
    if (req.session.usuario) {
        return res.json({ usuario: req.session.usuario });
    } else {
        return res.status(401).send("No hay sesión activa");
    }
});

// Ruta para redirigir a login.html
app.get("/", (req, res) => {
    res.redirect("/login.html");
});

app.post("/register", (req, res) => {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
        return res.status(400).send("Datos incompletos");
    }

    const regexUsuario = /^[a-zA-Z0-9_-]{3,20}$/;
    const regexPassword = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

    if (!regexUsuario.test(usuario)) {
        return res.status(400).send("Nombre de usuario inválido. Solo se permiten letras, números, guiones y guiones bajos (entre 3 y 20 caracteres)");
    }

    if (!regexPassword.test(password)) {
        return res.status(400).send("La contraseña debe tener al menos 8 caracteres, una letra mayúscula y un carácter especial");
    }

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

    const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
    const soloNumeros = /^\d+$/;

    const camposTexto = { nombre, ocupacion, ciudad, color, tipo, habilidad, frase };
    for (const [campo, valor] of Object.entries(camposTexto)) {
        if (!soloLetras.test(valor)) {
            return res.status(400).send(`El campo "${campo}" solo debe contener letras y espacios`);
        }
    }

    if (!soloNumeros.test(edad)) {
        return res.status(400).send("La edad debe contener solo números");
    }

    const edadNum = parseInt(edad);
    if (isNaN(edadNum)) {
        return res.status(400).send("La edad debe ser un número válido");
    }

    // Guardar el creador del personaje
    const creador = req.session.usuario;
    
    const sql = "INSERT INTO personaje (nombre, edad, ocupacion, ciudad, color, tipo, habilidad, frase, creador) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

    con.query(sql, [nombre, edadNum, ocupacion, ciudad, color, tipo, habilidad, frase, creador], (err, result) => {
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

app.put("/actualizarPersonaje/:id", autenticar, verificarPropietario, (req, res) => {
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

app.delete("/eliminarPersonaje/:id", autenticar, verificarPropietario, (req, res) => {
    const { id } = req.params;
    
    con.query("DELETE FROM personaje WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).send("Error al eliminar");
        if (result.affectedRows === 0) return res.status(404).send("No encontrado");
        res.send("Eliminado con éxito");
    });
});

app.listen(puerto, () => {
    console.log(`Servidor escuchando en el puerto:${puerto}`);
});