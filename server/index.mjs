import { createApp } from "./app.mjs";
const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || "127.0.0.1";
const { server } = createApp();
server.listen(port, host, () =>
  console.log(
    `Forkly API ready at http://${host}:${port}/api/health\nSQLite database persists in server/data unless DB_PATH is set.`,
  ),
);
server.on("error", (error) => {
  console.error(`Could not start the API: ${error.message}`);
  process.exit(1);
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.close(() => process.exit(0)));
