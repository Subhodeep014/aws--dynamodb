import express from 'express'
import cors from "cors"
import cookieParser from 'cookie-parser';
import registerRouter from './routes/register.route.js'
import dotenv from 'dotenv'


import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient, ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { RekognitionClient, IndexFacesCommand,SearchFacesByImageCommand } from "@aws-sdk/client-rekognition";
const s3Client = new S3Client({ region: "ap-south-1" });
const dynamoDbClient = new DynamoDBClient({ region: "ap-south-1" });
const rekognitionClient = new RekognitionClient({ region: "ap-south-1" });
const ddbDocClient = DynamoDBDocumentClient.from(dynamoDbClient);
const dynamodbTableName = "employee";

export const  lambda_handler=async(event)=>{
    console.log("Event:", JSON.stringify(event, null, 2));

    const bucket = event.Records[0].s3.bucket.name;
    const key = event.Records[0].s3.object.key;

    try {
        const response = await index_Employee_Image(bucket, key);
        console.log('Rekognition Response:', response);

        // Check if the Rekognition response is successful
        if (response.FaceRecords && response.FaceRecords.length > 0) {
            const faceId = response.FaceRecords[0].Face.FaceId;
            console.log('FaceId:', faceId);

            // Process the object key to extract first and last names
            const nameParts = key.split('.')[0].split('_');
            const firstName = nameParts[0];
            const lastName = nameParts[1];

            // Register the employee in DynamoDB
            await registerEmployee(faceId, firstName, lastName);
            return response;

        }
    } catch (error) {
        console.error("Error processing employee image:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error processing image" }),
        };
    }
}


// Function to index an employee image using AWS Rekognition
const index_Employee_Image = async (bucket, key) => {
    const params = {
        CollectionId: "employees", // Specify the collection ID for storing faces
        Image: {
            S3Object: {
                Bucket: bucket,
                Name: key,
            },
        },
        ExternalImageId: key, // Optionally use the key as an identifier
        DetectionAttributes: [],
    };

    // Call the Rekognition service to index the face
    const command = new IndexFacesCommand(params);
    const response = await rekognitionClient.send(command);
    return response;
};

const registerEmployee = async(faceId, firstName, lastName)=>{
    const params = {
        TableName: dynamodbTableName,
        Item: {
            FaceId: faceId,        // Partition key
            FirstName: firstName,  // Employee's first name
            LastName: lastName     // Employee's last name
        }
    };
    try {
        // Use the PutCommand to insert the item into DynamoDB
        const command = new PutCommand(params);
        await ddbDocClient.send(command);
        console.log("Employee registered successfully:", faceId);
    } catch (error) {
        console.error("Error registering employee:", error);
    }
}
// const employeeTable = dynamoClient.
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