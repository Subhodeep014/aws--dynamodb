import dotenv from 'dotenv'
dotenv.config()
export const awsConfig = {
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
};
console.log(awsConfig.region)