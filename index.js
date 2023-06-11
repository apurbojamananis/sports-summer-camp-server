const express = require("express");
const app = express();
const cors = require("cors");
var jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "Unauthorized access" });
  }

  // bearer token

  const token = authorization.split("")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "Unauthorized access" });
    }

    req.decoded = decoded;

    next();
  });
};

//Mongodb
const uri = `mongodb+srv://${process.env.SECRET_USERNAME}:${process.env.SECRET_KEY}@cluster0.orqgdcn.mongodb.net/?retryWrites=true&w=majority`;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const usersCollection = client.db("summerCamp").collection("users");
    const classesCollection = client.db("summerCamp").collection("allClasses");

    // jwT

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      res.send({ token });
    });

    // user
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "User Already Exists" });
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // security layer: verifyJWT
    // email same
    // check admin

    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;

      // if (req.decoded.email !== email) {
      //   res.send({ admin: false });
      // }
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      // const result = { admin: user?.role === "Admin" };
      res.send(result);
    });

    app.get("/users/instructors", async (req, res) => {
      // if (req.decoded.email !== email) {
      //   res.send({ admin: false });
      // }
      const query = { role: "Instructor" };
      const result = await usersCollection.find(query).toArray();
      // const result = { admin: user?.role === "Admin" };
      res.send(result);
    });

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const newRole = req.body.role;
      const filter = { _id: new ObjectId(id) };
      // console.log(newRole);
      const updateDoc = {
        $set: {
          role: newRole,
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // allClasses
    app.get("/allClasses", async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    });

    app.post("/allClasses", async (req, res) => {
      const classes = req.body;
      const result = await classesCollection.insertOne(classes);
      res.send(result);
    });

    app.patch("/allClasses/status/:id", async (req, res) => {
      const id = req.params.id;
      const newStatus = req.body.status;
      console.log(newStatus, id);
      const filter = { _id: new ObjectId(id) };
      // console.log(newRole);
      const updateDoc = {
        $set: {
          status: newStatus,
        },
      };

      const result = await classesCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.patch("/allClasses/feedback/:id", async (req, res) => {
      const id = req.params.id;
      const feedback = req.body.feedback;
      console.log(feedback, id);
      const filter = { _id: new ObjectId(id) };
      // console.log(newRole);
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          feedback: feedback,
        },
      };

      const result = await classesCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// Server Running
app.get("/", (req, res) => {
  res.send("Server is Running...");
});

app.listen(port, () => {
  console.log(`App is running on port: ${port}`);
});
