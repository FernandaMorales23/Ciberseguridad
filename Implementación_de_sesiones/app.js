const express = require("express");
const session = require("express-session");

const app = express();

app.use(
    session({
        secret: "mySecretKey",
        resave: false,
        saveUninitialized: false,
    })
);

app.get("/setSession", (req,res) => {
    req.session.username = "johnDoe";
    res.send("Session data set");
});

app.get("/getSession", (req, res) => {
    const username = req.session.username;
    res.send("Username:" + username);
});

app.get("/destroySession", (req,res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destruyendo sesión:", err);
            res.status(500).send("Error destruyendo sesión");
        } else {
          res.send("Sesión destruida");
        }
    });
});

app.listen(3000, () => (
    console.log("Servidor corriendo en el puerto 3000")
));