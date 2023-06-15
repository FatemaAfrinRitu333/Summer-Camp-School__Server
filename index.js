const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
// const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wqcwecn.mongodb.net/?retryWrites=true&w=majority`;

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

    const classCollection = client.db("ChorusCamp").collection("classes");
    const instructorCollection = client.db("ChorusCamp").collection("instructors");
    const userCollection = client.db("ChorusCamp").collection("users");
    const cartCollection = client.db("ChorusCamp").collection("cart");
    // const paymentCollection = client.db("ChorusCamp").collection("payment");

    // Class API
    app.get('/classes', async(req, res)=>{
      const sort = {studentsEnrolled: -1};
        const result = await classCollection.find().sort(sort).toArray();
        res.send(result);
    })

    // Instructor API
    app.get('/instructors', async(req, res)=>{
      const sort = {studentsEnrolled: -1};
      const result = await instructorCollection.find().sort(sort).toArray();
      res.send(result);
    })

    // Users API
    app.get('/users', async(req, res)=>{
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.post('/users', async(req, res)=>{
      const user = req.body;
      console.log(user);
      const query = {email: user.email}
      const existingUser = await userCollection.findOne(query);

      if(existingUser){
        return res.send({message: 'User Already Exists'})
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    })

    // Cart APIs
    app.get('/cart', async(req, res)=>{
      const email = req.query.email;

      const result = await cartCollection.find().toArray();
      res.send(result);
    })

    app.post('/cart', async(req, res)=>{
      const item = req.body;
      const result = await cartCollection.insertOne(item);
      res.send(result);
    })


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
