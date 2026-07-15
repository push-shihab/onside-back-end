import express, { NextFunction, Request, Response } from "express";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";
import cors from "cors";

const app = express();
dotenv.config();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript + Express!");
});

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.a82ocix.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();
    const db = client.db("onside");
    const allPlayers = db.collection("players");
    const sessionCollection = db.collection("session");
    const userCollection = db.collection("user");

    // verify token
    const verifyToken = async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const { authorization } = req.headers;
      if (!authorization) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const token = authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const userSession = await sessionCollection.findOne({ token });
      if (!userSession) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (!userSession) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await userCollection.findOne({ _id: userSession.userId });
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      next();
    };

    // getting all players
    app.get("/api/players", async (req: Request, res: Response) => {
      const result = await allPlayers.find().toArray();
      res.json(result);
    });

    // getting data of individual player
    app.get("/api/player", async (req: Request, res: Response) => {
      const id = req.query.id as string;
      const result = await allPlayers.findOne({ _id: new ObjectId(id) });
      res.json(result);
    });

    // getting all players by user id
    app.get(
      "/api/user/players",
      verifyToken,
      async (req: Request, res: Response) => {
        const id = req.query.id as string;
        const result = await allPlayers.find({ userId: id }).toArray();
        res.json(result);
      },
    );

    // creating a new player
    app.post(
      "/api/player/new",
      verifyToken,
      async (req: Request, res: Response) => {
        const playerData = req.body;
        const result = await allPlayers.insertOne(playerData);
        res.json(result);
      },
    );

    // updating player data by user
    app.patch(
      "/api/player/update",
      verifyToken,
      async (req: Request, res: Response) => {
        const updatedData = req.body;
        const filter = { _id: new ObjectId(updatedData.playerId) };
        const updatedFields = {
          $set: {
            ...updatedData,
          },
        };
        const result = await allPlayers.updateOne(filter, updatedFields);
        res.json(result);
      },
    );

    // deleting a player by user
    app.delete(
      "/api/player/delete",
      verifyToken,
      async (req: Request, res: Response) => {
        const id = req.query.id as string;
        const result = await allPlayers.deleteOne({ _id: new ObjectId(id) });
        res.json(result);
      },
    );

    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });
export default app;
