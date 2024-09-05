import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';
import { awsConfig } from "../awsConfig.js";


const s3Client = new S3Client(awsConfig);
const ddbClient = new DynamoDBClient(awsConfig);
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

export const newUser = async (req, res) => {
    
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { email, fullName } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const profileImage = req.file;

        // Upload image to S3
        const imageKey = `profile-images/${uuidv4()}-${profileImage.originalname}`;
        const uploadParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: imageKey,
            Body: profileImage.buffer,
            ContentType: profileImage.mimetype,
        };

        const uploadCommand = new PutObjectCommand(uploadParams);
        await s3Client.send(uploadCommand);

        const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;

        // Store user data in DynamoDB
        const userId = uuidv4();
        const putParams = {
            TableName: "users",
            Item: {
                email,
                userId,
                fullName,
                profileImageUrl: imageUrl,
            },
        };

        console.log('Attempting to store in DynamoDB:', JSON.stringify(putParams, null, 2));

        const putCommand = new PutCommand(putParams);
        
        try {
            const dynamoResult = await ddbDocClient.send(putCommand);
            console.log('DynamoDB insertion successful:', dynamoResult);
        } catch (dynamoError) {
            console.error('DynamoDB insertion failed:', dynamoError);
            throw dynamoError; // Re-throw to be caught by the outer try-catch
        }

        res.status(200).json({ success: true, message: 'User registered successfully', userId });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error registering user' });
    }
};