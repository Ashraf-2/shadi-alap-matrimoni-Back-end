const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');




const app = express();

const port = process.env.PORT || 5000;


app.use(express.json());
app.use(cors());

// console.log('userdb', process.env.DB_USER)
// console.log(process.env.DB_USER)



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const userCollection = client.db('shadi-alap-DB').collection('userCL');
        const contactRequestCollection = client.db('shadi-alap-DB').collection('contact-requestCL');
        const favouritesCollections = client.db('shadi-alap-DB').collection('favouriteCL');


        //middlewears
        const varifyToken = (req, res, next) => {
            console.log('inside varify token: ', req.headers);

            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'Unauthorized access' })
            }
            const token = req.headers.authorization.split(' ')[1];    //use your brain to know the functionality of this line :) 😊 

            jwt.verify(token, process.env.JSON_SECRET_KEY, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'Unauthorized access' })
                }
                req.decoded = decoded;
                next();
            })
            // next();

        }

        //middleWear - varify admin
        //middleWear -=> Verify Admin
        const varifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            const isAdmin = user?.role === 'admin';
            if (!isAdmin) {
                return res.status(403).send({ message: "Forbidden Access" })
            }
            next();
        }


        //crud operations

        //JWT related CRUD
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.JSON_SECRET_KEY, { expiresIn: '1h' });
            res.send({ token })
        })

        //biodata - related crud
        app.get('/biodata', async (req, res) => {
            // console.log("hello");
            try {
                const result = await biodataCollection.find().toArray();
                res.send(result);
            } catch (error) {
                console.log(error)
            }
        })
        app.get('/biodata/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) };
                const result = await biodataCollection.findOne(query);
                res.send(result);
            } catch (error) {
                console.log(error)
            }
        })
        //specific user biodata 
        app.get('/biodata/person/:email', async (req, res) => {
            try {
                const email = req.params.email;
                const query = { email: email };
                const result = await biodataCollection.findOne(query);
                res.send(result)
            } catch (error) {
                console.log(error)
            }
        })

        //Gender wise biodata
        app.get('/biodataGender/:gender', async (req, res) => {
            // console.log('gender wise data hitted')
            try {
                const gender = req.params.gender;
                // console.log(gender)
                const query = { gender: gender };
                const result = await biodataCollection.find(query).toArray();
                // console.log(result)
                // res.send({result, gender});
                res.send(result);
            } catch (error) {
                console.log(error)
            }
        })

        //post - store biodata.
        app.patch('/biodata/:email', async (req, res) => {
            console.log('biodata hitted by email')
            try {
                const email = req.params.email;
                const biodata = req.body;
                const query = { email: email };
                const existUser = await biodataCollection.findOne(query);
                if (existUser) {
                    //update his data.
                    const updateDoc = {
                        $set: {
                            biodata
                        }
                    }
                    const options = { upsert: true }
                    const result = await biodataCollection.updateOne(query, updateDoc, options);
                    res.send(result);

                } else {
                    //post his data
                    const result = await biodataCollection.insertOne(biodata)
                    res.send(result);
                }
                console.log(email);
                console.log(biodata);
            } catch (error) {
                console.log(error)
            }
        })

        //ALL user related CRUD - all user in database
        app.get('/users', async (req, res) => {
            try {
                // console.log(req.headers);
                const result = await userCollection.find().toArray();
                res.send(result);

            } catch (error) {
                console.log(error);
            }
        })

        // get user data using email
        app.get('/users/:email', async (req, res) => {
            try {
                const email = req.params.email;
                const query = { email: email };
                const result = await userCollection.findOne(query);
                // console.log(result)
                res.send(result);
            } catch (error) {
                console.log(error)
            }
        })


        app.patch('/users/premimum/:email', async(req,res)=> {
            console.log('hitted premimum making');
            try {
                const email = req.params.query;
                const query = {email: email};
                const body = req.body;
                console.log(body);
            } catch (error) {
                console.log(error)
            }
        })

        //store new user in database
        app.post('/users', async (req, res) => {
            try {
                const user = req.body;
                const query = { email: user.email };
                console.log(user, user.email);
                const existUser = await userCollection.findOne(query);
                if (existUser) {
                    return res.send({
                        message: "sorry, user already register to the database.",
                        insertedId: null
                    })
                }
                const result = await userCollection.insertOne(user);
                res.send(result);
            } catch (error) {
                console.log(error);
            }
        })


        //make user admin
        app.patch('/user/admin/:id', async(req,res)=> {
            try {
                const id = req.params.id;
                const query = {_id: new ObjectId(id)};
                const updatedDoc = {
                    $set:{
                        role: 'admin',
                    }
                }
                const result = await userCollection.updateOne(query,updatedDoc)
                res.send(result);
            } catch (error) {
                console.log(error)
            }
        })

        //favourite persons related CRUD -- maitaining a favourite collections.
        //get favourite persons based on logged in user
        app.get('/favourite/:email', async(req,res)=> {
            console.log('fav email wise hitted')
            try {
                const email = req.params.email;
                const query = {userEmail: email};
                const result = await favouritesCollections.find(query).toArray();
                console.log(result);
                res.send(result)
            } catch (error) {
                console.log(error)
            }
        })

        //store favourite person in database.
        app.put('/favourite', async(req,res)=> {
            const email = req.params.email;
            const query = {email: email};
            const body = req.body;
           
            const result = await favouritesCollections.insertOne(body)
            console.log(body)
            res.send(result)
        })

        //delete favourite person - api
        app.delete('/favourite/:id', async(req,res)=> {
            try {
                const id = req.params.id;
                const query = {_id: new ObjectId(id)};
                const result = await favouritesCollections.deleteOne(query);
                res.send(result)
            } catch (error) {
                console.log(error)
            }
        })

        //to know isAdmin - api
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === 'admin'; //admin will true
                // if(user?.role ==)
            }
            res.send({ admin })
        })





        //contact-request related api

        app.get('/contact-request', async (req, res) => {
            try {
                const result = await contactRequestCollection.find().toArray();
                res.send(result);
            } catch (error) {
                console.log(error)
            }
        })

        //contact request - patch
        // app.patch('/contact-request', async (req, res) => {
        //     try {
        //         const request_body = req.body;
        //         console.log(request_body);
        //         const { requesterEmail } = request_body;
        //         console.log(requesterEmail);
        //         const filter = { email: requesterEmail };
        //         // console.log(isExist);
        //         const newRequest = {
        //             requestedId: request_body?.requestedId,
        //             requestedPhoneNumber: request_body?.requestedPhoneNumber,
        //             requestStatus: 'pending',
        //             paid: '500',
        //         }

        //         //first update: make the contact request as it is an array.
        //         const firstUpdate = {
        //             $setOnInsert: {
        //                 contactRequest: []
        //             },
        //             $set: {
        //                 requesterId: request_body?.requesterId,
        //                 requesterEmail: request_body?.requesterEmail,
        //             }
        //         }
        //         const FirstOptions = { upsert: true };
        //         const result1 = await contactRequestCollection.updateOne(filter, firstUpdate, FirstOptions);
        //         console.log("first Update: ", result1);

        //         //second update: now update the array element on every request for contact info.
        //         const secondUpdate = {
        //             $push: {
        //                 contactRequest: newRequest,
        //             }
        //         }
        //         const secondOptions = { upsert: true };
        //         const finalResult = await contactRequestCollection.updateOne(filter, secondUpdate, secondOptions)
        //         console.log('final result: ', finalResult);
        //         res.send(finalResult)

        //     } catch (error) {
        //         console.log(error)
        //     }
        // })

        app.post('/contact-request',async(req,res)=> {
            try {
                const body = req.body;
                const result = await contactRequestCollection.insertOne(body);
                res.send(result);
            } catch (error) {
                console.log(error)
            }
        })
        //get contact request information based on email 
        app.get('/contact-request/:email', async(req,res)=> {
            try {
                const email = req.params.email;
                const query = {requesterEmail: email};
                const result = await contactRequestCollection.find(query).toArray();
                console.log(result);
                res.send(result)
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
