import express from 'express'
import cors from "cors"
import cookieParser from 'cookie-parser';
import registerRouter from './routes/register.route.js'
import dotenv from 'dotenv'
dotenv.config()


const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    credentials :true
}))


app.use('/api/register', registerRouter)
app.listen(3000,()=>{
    console.log("app is running on port 3000!")
})