import app from "@/app";
import { config } from "dotenv";
import ConnectDB from "@/utils/db";
config();

ConnectDB();

app.listen(3000, () => {
  console.log("App Run!");
});
