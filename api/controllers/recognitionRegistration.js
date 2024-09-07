import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { RekognitionClient, IndexFacesCommand } from "@aws-sdk/client-rekognition";

const s3Client = new S3Client({ region: "ap-south-1" });
const dynamoDbClient = new DynamoDBClient({ region: "ap-south-1" });
const rekognitionClient = new RekognitionClient({ region: "ap-south-1" });
const ddbDocClient = DynamoDBDocumentClient.from(dynamoDbClient);
const dynamodbTableName = "employee";

export const handler = async (event) => {
    console.log("Event:", JSON.stringify(event, null, 2));
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

    try {
        const response = await indexEmployeeImage(bucket, key);
        console.log('Rekognition Response:', response);

        if (response.FaceRecords && response.FaceRecords.length > 0) {
            const faceId = response.FaceRecords[0].Face.FaceId;
            console.log('FaceId:', faceId);

            const nameParts = key.split('.')[0].split('_');
            const firstName = nameParts[0];
            const lastName = nameParts[1];

            await registerEmployee(faceId, firstName, lastName);
            
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "Employee registered successfully", faceId: faceId }),
            };
        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "No face detected in the image" }),
            };
        }
    } catch (error) {
        console.error("Error processing employee image:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error processing image", error: error.message }),
        };
    }
};

const indexEmployeeImage = async (bucket, key) => {
    const params = {
        CollectionId: "employees",
        Image: {
            S3Object: {
                Bucket: bucket,
                Name: key,
            },
        },
        ExternalImageId: key,
        DetectionAttributes: ["ALL"],
    };

    const command = new IndexFacesCommand(params);
    return rekognitionClient.send(command);
};

const registerEmployee = async (faceId, firstName, lastName) => {
    const params = {
        TableName: dynamodbTableName,
        Item: {
            recognitionId: faceId,  // Changed from FaceId to recognitionId
            FirstName: firstName,
            LastName: lastName,
            RegisteredAt: new Date().toISOString()
        }
    };

    try {
        const command = new PutCommand(params);
        await ddbDocClient.send(command);
        console.log("Employee registered successfully:", faceId);
    } catch (error) {
        console.error("Error registering employee:", error);
        throw error; // Re-throw the error to be caught in the main handler
    }
};