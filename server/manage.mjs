import { randomBytes, randomUUID } from "node:crypto";
import { openDatabase } from "./database.mjs";
import { hashPassword } from "./auth.mjs";
import { statuses } from "../shared/order.mjs";
const db = openDatabase();
const [command, id, ...args] = process.argv.slice(2);
try {
  if (command === "orders") {
    const rows = db
      .prepare("SELECT id,data FROM orders ORDER BY created_at DESC LIMIT 100")
      .all();
    console.table(
      rows.map((row) => {
        const o = JSON.parse(row.data);
        return {
          id: o.id,
          status: o.status,
          restaurant: o.restaurantId,
          total: `INR ${(o.total / 100).toFixed(2)}`,
          date: o.createdAt,
        };
      }),
    );
  } else if (command === "status") {
    const status = args[0];
    const row = db.prepare("SELECT data FROM orders WHERE id=?").get(id);
    if (!row) throw new Error("Order not found.");
    const order = JSON.parse(row.data);
    if (order.status === "cancelled" || order.status === "delivered")
      throw new Error("This order is already final.");
    const validNext = statuses[statuses.indexOf(order.status) + 1];
    if (status !== validNext && status !== "cancelled")
      throw new Error(`Next status must be ${validNext} or cancelled.`);
    order.status = status;
    db.prepare("UPDATE orders SET data=? WHERE id=?").run(
      JSON.stringify(order),
      id,
    );
    console.log(`${id}: ${status}`);
  } else if (command === "messages") {
    console.table(
      db
        .prepare(
          "SELECT order_id,role,text,created_at FROM messages WHERE order_id=? ORDER BY created_at",
        )
        .all(id),
    );
  } else if (command === "reply") {
    const row = db.prepare("SELECT user_id FROM orders WHERE id=?").get(id);
    if (!row) throw new Error("Order not found.");
    const text = args.join(" ").trim();
    if (!text || text.length > 1000)
      throw new Error("Reply must be 1–1000 characters.");
    db.prepare(
      "INSERT INTO messages(id,order_id,user_id,role,text,created_at) VALUES(?,?,?,?,?,?)",
    ).run(
      randomUUID(),
      id,
      row.user_id,
      "support",
      text,
      new Date().toISOString(),
    );
    console.log("Reply saved. The customer sees it on refresh.");
  } else if (command === "reset-password") {
    const email = String(id || "")
      .trim()
      .toLowerCase();
    const user = db.prepare("SELECT id FROM users WHERE email=?").get(email);
    if (!user) throw new Error("Account not found.");
    const password = randomBytes(15).toString("base64url");
    const { salt, hash } = await hashPassword(password);
    db.prepare("UPDATE users SET salt=?,password_hash=? WHERE id=?").run(
      salt,
      hash,
      user.id,
    );
    db.prepare("DELETE FROM sessions WHERE user_id=?").run(user.id);
    console.log(
      `Temporary password: ${password}\nDeliver it securely to the verified account owner. They should change it in Settings. All previous sessions were revoked.`,
    );
  } else
    console.log(
      'Local operator commands (requires database access):\nnode --env-file-if-exists=.env server/manage.mjs orders\nnode --env-file-if-exists=.env server/manage.mjs status ORDER_ID preparing|on_the_way|delivered|cancelled\nnode --env-file-if-exists=.env server/manage.mjs messages ORDER_ID\nnode --env-file-if-exists=.env server/manage.mjs reply ORDER_ID "Your message"\nnode --env-file-if-exists=.env server/manage.mjs reset-password EMAIL',
    );
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  db.close();
}
