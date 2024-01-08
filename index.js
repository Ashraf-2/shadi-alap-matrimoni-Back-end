const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

const port = process.env.PORT || 5000;


app.use(express.json());
app.use(cors());

// console.log('userdb', process.env.DB_USER)
// console.log(process.env.DB_USER)



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bx5otjq.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        //databse collections
        const biodataCollection = client.db('shadi-alap-DB').collection('bioDataCL');


        //crud operations
        app.get('/biodata', async (req, res) => {
            // console.log("hello");
            try {
                const result = await biodataCollection.find().toArray();
                res.send(result);
            } catch (error) {
                console.log(error)
            }
        })



        // Send a ping to confirm a successful connection 
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('shadi-alap server is running')
})

app.listen(port, () => {
    console.log(`shadi-alap server is running on port ${port}`)
})
