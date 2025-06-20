import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

/** STEP 1 – serve everything under /public as static files */
app.use(
  express.static(path.join(__dirname, "public"), {
    setHeaders: res => {
      // Ensure JS is sent with the right MIME type
      if (res.req.url.endsWith(".js")) {
        res.type("application/javascript");
      }
    },
  })
);

/** STEP 2 – serve index.html for all other routes (SPA) */
app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/** STEP 3 – start server */
app.listen(PORT, () =>
  console.log(`➜  Sara Safety dev server running at http://localhost:${PORT}`)
);
