
const express = require('express')
const cors = require('cors')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const SSLCommerzPayment = require('sslcommerz-lts')
const store_id = 'abc6682aac6e7059'
const store_passwd = 'abc6682aac6e7059@ssl'
const is_live = false

const port = process.env.PORT || 3000

//middleware
app.use(cors())
app.use(express.json())







const uri = "mongodb+srv://cu_payment:de9eGvCfuYXnJ1FH@cluster0.6v8amsy.mongodb.net/?appName=Cluster0";


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


        const formDataCollection = client.db('formDataDB').collection('formData')
        const paymentCollection = client.db('paymentDB').collection('payment')





        app.post('/form-data', (req, res) => {

            // const id = req.params.id
            // const query  = { _id : new ObjectId(id)}

            const trans_id = new ObjectId().toString()
            // console.log(trans_id);

            const formInfo = req.body
            // console.log(formInfo.total);


            const data = {
                total_amount: formInfo.total,
                currency: 'BDT',
                tran_id: trans_id, // use unique tran_id for each api call
                success_url: `http://localhost:3000/payment/success/${trans_id}`,
                fail_url: `http://localhost:3000/payment/failed/${trans_id}`,
                cancel_url: 'http://localhost:3030/cancel',
                ipn_url: 'http://localhost:3030/ipn',
                shipping_method: 'Courier',
                product_name: 'Computer.',
                product_category: 'Electronic',
                product_profile: 'general',
                cus_name: formInfo.name,
                cus_email: formInfo.email,
                cus_add1: 'Dhaka',
                cus_add2: 'Dhaka',
                cus_city: 'Dhaka',
                cus_state: 'Dhaka',
                cus_postcode: '1000',
                cus_country: 'Bangladesh',
                cus_phone: formInfo.phone,
                cus_fax: '01711111111',
                ship_name: 'Customer Name',
                ship_add1: 'Dhaka',
                ship_add2: 'Dhaka',
                ship_city: 'Dhaka',
                ship_state: 'Dhaka',
                ship_postcode: 1000,
                ship_country: 'Bangladesh',
            };
            const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
            sslcz.init(data).then(apiResponse => {
                // Redirect the user to payment gateway
                let GatewayPageURL = apiResponse.GatewayPageURL
                res.send({ url: GatewayPageURL })


                const finalPayment = {
                    formInfo, paidStatus: false,
                    transId: trans_id,
                }

                const result = paymentCollection.insertOne(finalPayment)
                // res.send(result)

                console.log('Redirecting to: ', GatewayPageURL)
            });


            app.post('/payment/success/:transId', async (req, res) => {
                console.log('post',req.params.transId);
                const transId = req.params.transId
                const result = await paymentCollection.updateOne(
                    { transId },
                    {
                        $set: {
                            paidStatus: true
                        }
                    })

                if (result.modifiedCount > 0) {
                    res.redirect(`http://localhost:5173/payment/success/${req.params.transId}`)
                }
            })



            // Fetch payment details based on transaction ID
            // app.get('/payment/success/:transId', async (req, res) => {
            //     const transId = req.params.transId;
            //     console.log(" backend get" , transId);
            //     const result = await paymentCollection.findOne({ transId : transId });
            //     res.send(result)

            // });



            app.post('/payment/failed/:transId', async (req, res) => {
                const result = await paymentCollection.deleteOne({ transId: req.params.transId })
                if (result.deletedCount) {
                    res.redirect(`http://localhost:5173/payment/failed/${req.params.transId}`)
                }
            })

            console.log(data);
        })










        app.post('/form-data', async (req, res) => {
            const formData = req.body
            console.log("formData", formData);
            const result = await formDataCollection.insertOne(formData)
            res.send(result)
            console.log(result);
        })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('CRUD  is running ......!')
})

app.listen(port, () => {
    console.log(`App is  listening on port ${port}`)
})
