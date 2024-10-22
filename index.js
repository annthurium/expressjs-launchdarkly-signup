const express = require("express");
const path = require("path");
const serveStatic = require("serve-static");
const bodyParser = require("body-parser");
const LaunchDarkly = require("@launchdarkly/node-server-sdk");
require("dotenv").config();

const app = express();

app.use(serveStatic(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));

let context = {
  kind: "user",
  anonymous: true,
  key: "anonymous-82390850932485093284",
};

app.get("/", async (req, res) => {
  // Evaluate LaunchDarkly flag
  const showSeasonalStyling = await ldClient.variation(
    "show-seasonal-css",
    context,
    false
  );
  console.log("showSeasonalStyling", showSeasonalStyling);
  let url;
  if (showSeasonalStyling === "Spooky CSS") {
    url = "signup-2.html";
  } else {
    url = "signup.html";
  }
  res.redirect(url);
});

// Initialize the LaunchDarkly client
const ldClient = LaunchDarkly.init(process.env.LAUNCHDARKLY_SDK_KEY);

app.post("/login", async (req, res) => {
  await ldClient.track("signup-conversion", context, 1);

  res.send(
    `Thanks for signing up! Look for the confirmation email in your inbox: ${req.body.email}`
  );
  // insert your actual authentication logic here
});

// Add the waitForInitialization function to ensure the client is ready before starting the server
const timeoutInSeconds = 5;
ldClient.waitForInitialization({ timeout: timeoutInSeconds }).then(() => {
  const port = 3000;
  const server = app.listen(port, function (err) {
    if (err) console.log("Error in server setup");
    console.log(`Server listening on http://localhost:${port}`);
  });
});

// Add the following new function to gracefully close the connection to the LaunchDarkly server.
process.on("SIGTERM", () => {
  debug("SIGTERM signal received: closing HTTP server");
  ld.close();
  server.close(() => {
    debug("HTTP server closed");
    ldClient.close();
  });
});
