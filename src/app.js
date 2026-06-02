import express from "express"
import cors from "cors"
import path from "path";
import cookieParser from "cookie-parser";
import userRouter from './routes/user.routes.js'
import staticRouter from './routes/static.routes.js'
import productsRouter from './routes/products.routes.js'
import cartRouter from './routes/carts.routes.js'
import paymentRouter from './routes/payments.routes.js'
import ordersRouter from './routes/orders.routes.js'
import delhiveryRouter from './routes/delhivery.routes.js'
import adminRouter from './routes/admin.routes.js'
import session from "express-session";
import Razorpay from "razorpay";
import bodyParser from "body-parser";



const app = express();
app.use(bodyParser.urlencoded({extended: true}))

// const razorpay = new Razorpay({
//     key_id: '',
//     key_secret: ''
// })

app.set("view engine","ejs");
app.set('views', path.resolve("./views"));
app.set('trust proxy',true);

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// Session

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {maxAge: 604800000 ,
        secure:false,
        httpOnly: true
    }
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/users",userRouter)
app.use("/",staticRouter)
app.use("/products",productsRouter)
app.use(cartRouter)
app.use(paymentRouter)
app.use(ordersRouter);
app.use(delhiveryRouter);
app.use(adminRouter);

// app.use('/api/cart', cartRouter);

export {app} 