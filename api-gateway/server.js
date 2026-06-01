const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const CryptoJS = require("crypto-js");

const port = 9000;
const host = "localhost";

app.set("views", path.join(__dirname));
app.set("view engine", "ejs");

app.get('/api/user/verify', async (req, res) => {
    const id = req.query.id;

    if (!id) {
        return res.redirect("http://localhost:8000/index.php?page=login");
    }

    // 1. Wczytaj hasło z pliku
    const pass = fs.readFileSync("/Users/admin/Desktop/Authorization-server-OAuth2-JWT/server/pass.txt").toString();

    // 2. Pobierz secret z serwera Java
    const response = await fetch("http://127.0.0.1:8080/api/auth/jwtsecret?secret=" + pass);
    const resp = await response.text();
    const secret = JSON.parse(resp).secret;

    

    // 3. Pobierz token z cookie
    const rawCookie = req.headers.cookie || "";
    const token = rawCookie
        .split("; ")
        .find(c => c.startsWith("jwt_token="))
        ?.split("=")[1];

    if (!token) {
        console.log("[!] No JWT token in cookies");
        return res.status(401).send("Unauthorized");
    }

    console.log("[*] Extracted token:", token);

    // 4. Rozbij JWT
    const [jwt_header, jwt_payload, jwt_signature] = token.split(".");

    // 5. Oblicz podpis
    const signature = CryptoJS.HmacSHA384(
        jwt_header + "." + jwt_payload,
        CryptoJS.enc.Utf8.parse(secret)
    );

    const base64 = CryptoJS.enc.Base64.stringify(signature);

    const created_sig = base64
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

    console.log("[*] Created signature:", created_sig);
    console.log("[*] Original signature:", jwt_signature);

    var control = 0;
    if (created_sig === jwt_signature) {
        console.log("[+] JWT VALID");
        control = 1;
    } else {
        console.log("[!] JWT INVALID");
    }


    if(control){
        const request = await fetch("http://localhost:3000/api/users/view?id=" + id) // user-service/ in internal network
        var data = await request.json();
        console.log("[*] User data:", data);
        res.status(200).send(`${data["message"]}. You got: ${data["Your info"]}! `);
    } else {
        res.status(200).send(`Hello Vova! Your id is ${id}`);
    }
});

app.listen(port, () => {
    console.log(`APIGateway is running on: http://${host}:${port}`);
});
