const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
// const stripe = require("stripe")(process.env.);
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wqcwecn.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyJWT = (req, res, next) => {
  // console.log('Hitting verifyJWT')
  const authorization = req.headers.authorization;
  // console.log(authorization);
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  const token = authorization.split(' ')[1];
  // console.log('token from jwt', token);
  jwt.verify(token, process.env.TOKEN, (error, decoded) => {
    if (error) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const classCollection = client.db("ChorusCamp").collection("classes");
    const instructorCollection = client.db("ChorusCamp").collection("instructors");
    const userCollection = client.db("ChorusCamp").collection("users");
    const cartCollection = client.db("ChorusCamp").collection("cart");
    const addedClassCollection = client.db("ChorusCamp").collection("newClasses");
    // const paymentCollection = client.db("ChorusCamp").collection("payment");

    // jwt
    app.post("/jwt", (req, res) => {
      const user = req.body;
      // console.log('user', user);
      const token = jwt.sign(user, process.env.TOKEN, { expiresIn: "1h" });
      res.send({ token });
    });

    // Class API
    app.get("/classes", async (req, res) => {
      const sort = { studentsEnrolled: -1 };
      const result = await classCollection.find().sort(sort).toArray();
      res.send(result);
    });

    // Instructor API
    app.get("/instructors", async (req, res) => {
      const sort = { studentsEnrolled: -1 };
      const result = await instructorCollection.find().sort(sort).toArray();
      res.send(result);
    });

    // Users API
    // TODO: verifyJWT, verifyAdmin
    app.get("/users", verifyJWT, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      // console.log(user);
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "User Already Exists" });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

     // Admin API
     app.patch('/users/admin/:id', async(req, res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedUser = {
        $set: {
          role: "admin"
        },
      };
      const result = await userCollection.updateOne(filter, updatedUser);
      res.send(result);
     })

     app.get('/users/admin/:email', verifyJWT, async(req, res)=>{
      const email = req.params.email;
      console.log('admin api get',email)
      if(req.decoded.email != email){
        res.send({admin: false});
      }
      const query = {email: email};
      const user = await userCollection.findOne(query);
      const result = {admin: user?.role === 'admin'};
      res.send(result);
     })

    //  Instructor API
    app.patch('/users/instructor/:id', async(req, res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedUser = {
        $set: {
          role: "instructor"
        },
      };
      const result = await userCollection.updateOne(filter, updatedUser);
      res.send(result);
     })

     app.get('/users/instructor/:email', verifyJWT, async(req, res)=>{
      const email = req.params.email;
      if(req.decoded.email != email){
        res.send({instructor: false});
      }
      const query = {email: email};
      const user = await userCollection.findOne(query);
      const result = {admin: user?.role === 'instructor'};
      res.send(result);
     })


    // Cart APIs
    app.get("/cart", verifyJWT, async (req, res) => {
      // console.log('headers:',req.headers);
      const email = req.query.email;
      // console.log("email", email);
      if (!email) {
        res.send([]);
      }
      const decodedEmail = req.decoded.email;
      // console.log("decoded email:", decodedEmail);
      if (email !== decodedEmail) {
        return res
          .status(403)
          .send({ error: true, message: "forbidden access" });
      }
      const query = { email: email };

      const result = await cartCollection.find(query).toArray();
      // console.log("result", result);
      res.send(result);
    });

    app.post("/cart", async (req, res) => {
      const item = req.body;
      const result = await cartCollection.insertOne(item);
      res.send(result);
    });

    app.delete('/cart/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    })

    // instructor added class api
    app.post('/addedClass', async(req, res)=>{
      const item = req.body;
      const result = await addedClassCollection.insertOne(item);
      res.send(result);
    })

    // app.get('/addedClass', verifyJWT, async(req, res)=>{
    //   const email = req.
    // })

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

app.get("/", (req, res) => {
  res.send("Chorus Camp server");
});

app.listen(port, () => {
  console.log(`Chorus Camp is running on port: ${port}`);
});
