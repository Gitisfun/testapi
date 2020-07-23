const express = require("express");
const logger = require("./middleware/logger");


const cors = require("cors");
const app = express();

const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize middleware
app.use(logger);

app.get("/", (req, res) => {
  res.send("<h1>Hello world!!</h1>");
});

// Members API Routes
app.use("/api/btw", require("./routes/api/btw"));
app.use("/api/klanten", require("./routes/api/klanten"));
app.use("/api/leveranciers", require("./routes/api/leverancier"));
app.use("/api/artikels", require("./routes/api/artikels"));
app.use("/api/betalingstermijnen", require("./routes/api/betalingstermijnen"));
app.use("/api/teksten", require("./routes/api/teksten"));
app.use("/api/adressenleveranciers", require("./routes/api/adressenleveranciers"));
app.use("/api/adressenklanten", require("./routes/api/adressenklanten"));
app.use("/api/aankopen", require("./routes/api/aankopen"));
app.use("/api/verkopen", require("./routes/api/verkopen"));
app.use("/api/creditnotas", require("./routes/api/creditnota"));
app.use("/api/login", require("./routes/api/login"));
app.use("/api/gebruikers", require("./routes/api/gebruiker"));
app.use("/api/verkopers", require("./routes/api/verkopers"));
app.use("/api/counteraankopen", require("./routes/api/counteraankopen"));
app.use("/api/counterverkopen", require("./routes/api/counterverkopen"));
app.use("/api/countercreditnota", require("./routes/api/countercreditnota"));

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("aankooptable", (data) => {
    console.log("Aankoop tabel")
    socket.broadcast.emit("aankooptable", data);
  });

  socket.on("verkooptable", (data) => {
    console.log("Verkoop tabel")
    socket.broadcast.emit("verkooptable", data);
  });

  socket.on("creditnotatable", (data) => {
    console.log("Credit tabel")
    socket.broadcast.emit("creditnotatable", data);
  });

  socket.on("klantentable", (data) => {
    console.log("Klanten tabel")
    socket.broadcast.emit("klantentable", data);
  });

  socket.on("leverancierstable", (data) => {
    console.log("Leverancier tabel")
    socket.broadcast.emit("leverancierstable", data);
  });

  socket.on("artikeltable", (data) => {
    console.log("Artikel tabel")
    console.log(data);
    socket.broadcast.emit("artikeltable", data);
  });

  socket.on("anderetable", (data) => {
    console.log("Andere tabel")
    socket.broadcast.emit("anderetable", data);
  });

  socket.on("instellingen", (data) => {
    console.log("Instellingen")
    socket.broadcast.emit("instellingen", data);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

});

const PORT = process.env.PORT || 5000;

http.listen(PORT, () => console.log(`Server started on port ${PORT}`));
