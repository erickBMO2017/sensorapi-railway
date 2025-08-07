const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;
const URL_BI = "https://boostbi.v-count.com/api/v4/";


app.use(cors());
app.use(express.json());



const path = require("path");

// Servir archivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "..")));

// Ruta principal para servir index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});


// Ruta para manejar la importación de datos
app.post("/proxy", async (req, res) => {
    try {
        console.log("Datos enviados a la API:", req.body);

        const response = await axios.post(URL_BI+"import_count", req.body, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error("Error en la API externa:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: "Error en la solicitud",
            details: error.response?.data || error.message
        });
    }
});

// Nueva ruta para obtener datos de ventas por hora
app.post("/sales_hourly", async (req, res) => {
    try {
        console.log("Datos enviados a la API (sales_hourly):", req.body);

        const response = await axios.post(URL_BI+"sales_hourly", req.body, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error("Error en la API externa (sales_hourly):", error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: "Error en la solicitud",
            details: error.response?.data || error.message
        });
    }
});

// Nueva ruta para obtener datos de ventas por dia
app.post("/sales", async (req, res) => {
    try {
        console.log("Datos enviados a la API (sales):", req.body);

        const response = await axios.post(URL_BI+"sales", req.body, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error("Error en la API externa (sales):", error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: "Error en la solicitud",
            details: error.response?.data || error.message
        });
    }
});

// Nueva ruta para exportar trafico por dia
app.post("/exporttraficcday", async (req, res) => {
    try {
        console.log("Datos enviados a la API (sales):", req.body);

        const response = await axios.post(URL_BI+"vcountapi_daily", req.body, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error("Error en la API externa (sales):", error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: "Error en la solicitud",
            details: error.response?.data || error.message
        });
    }
});

// Nueva ruta para exportar trafico por hora    
app.post("/exporttraficchour", async (req, res) => {
    try {
        console.log("Datos enviados a la API (sales):", req.body);

        const response = await axios.post(URL_BI+"vcountapi", req.body, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error("Error en la API externa (sales):", error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: "Error en la solicitud",
            details: error.response?.data || error.message
        });
    }
});

// Ruta para obtener los client stores
app.post("/clientstores", async (req, res) => {
    try {

        const response = await axios.post(URL_BI+"clientstores", req.body, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error("Error en la API externa:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: "Error en la solicitud",
            details: error.response?.data || error.message
        });
    }
});

// Ruta para manejar la autenticación
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    // Aquí deberías validar el usuario y la contraseña con tu lógica de autenticación
    const isAuthenticated = (username === "admin" && password === "password"); // Ejemplo estático

    if (isAuthenticated) {
        res.json({ message: "Autenticación exitosa" });
    } else {
        res.status(401).json({
            error: "Error de autenticación",
            details: "Usuario o contraseña incorrectos."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
