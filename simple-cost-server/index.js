const cors = require("cors");
const express = require("express");
const compression = require("compression");
const logger = require("morgan");

const costServer = require("./cost-server");

const port = parseInt(process.env.PORT || "3000");
const app = express();

app.disable("x-powered-by");
app.use(compression());
app.use(logger("dev"));
app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true, credentials: true }));

app.use("/cost", costServer);

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(`port ${port} requires elevated privileges`);
      process.exit(1);
    case "EADDRINUSE":
      console.error(`port ${port} is already in use`);
      process.exit(1);
    default:
      throw error;
  }
}

app.on("error", onError);
app.listen(port);
console.log(`listening on port ${port}`);
