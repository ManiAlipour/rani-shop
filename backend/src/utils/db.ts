import mongoose from "mongoose";

export default async function ConnectDB() {
  const uri = process.env.MONGODB_URI;

  const config = async () => {
    if (!uri) throw new Error("MONGODB_URI is not found");

    try {
      await mongoose.connect(uri);
    } catch (error) {
      throw new Error("something is wrong");
    }
  };

  return config()
    .then(() => console.log("Database connected"))
    .catch((err) => console.log("ERROR: ", err));
}
