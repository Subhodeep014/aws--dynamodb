import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { RekognitionClient, SearchFacesByImageCommand } from "@aws-sdk/client-rekognition";

const s3Client = new S3Client({ region: "ap-south-1" });
const dynamoDbClient = new DynamoDBClient({ region: "ap-south-1" });
const rekognitionClient = new RekognitionClient({ region: "ap-south-1" });
const ddbDocClient = DynamoDBDocumentClient.from(dynamoDbClient);

const dynamodbTableName = "employee";
const bucketName = 'visitor-image-storage-v1';
const collectionId = 'employees';

export const handler = async (event) => {
    console.log("Event:", JSON.stringify(event, null, 2));
    

    const objectKey = event.queryStringParameters?.objectKey;

    if (!objectKey) {
        return buildResponse(400, { Message: "Missing objectKey parameter" });
    }

    try {
        const imageBytes = await getImageFromS3(objectKey);
        const matchedFaces = await searchFacesInCollection(imageBytes);

        for (const match of matchedFaces) {
            console.log('FaceId:', match.Face.FaceId, 'Confidence:', match.Face.Confidence);
            const employeeData = await getEmployeeData(match.Face.FaceId);
            
            if (employeeData) {
                console.log('Person Found:', employeeData);
                return buildResponse(200, {
                    Message: "Success",
                    firstName: employeeData.FirstName,
                    lastName: employeeData.LastName
                });
            }
        }

        console.log("Person could not be recognized.");
        return buildResponse(403, { Message: "Person Not Found" });
    } catch (error) {
        console.error('Error:', error);
        return buildResponse(500, { Message: `Error processing image: ${error.message}` });
    }
};

const getImageFromS3 = async (objectKey) => {
    const s3Response = await s3Client.send(new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey
    }));
    return streamToBuffer(s3Response.Body);
};

const searchFacesInCollection = async (imageBytes) => {
    const rekognitionResponse = await rekognitionClient.send(new SearchFacesByImageCommand({
        CollectionId: collectionId,
        Image: { Bytes: imageBytes },
        MaxFaces: 1,  // Assuming we're looking for one person at a time
        FaceMatchThreshold: 95  // Adjust this threshold as needed
    }));
    return rekognitionResponse.FaceMatches;
};

const getEmployeeData = async (faceId) => {
    const response = await ddbDocClient.send(new GetCommand({
        TableName: dynamodbTableName,
        Key: { recognitionId: faceId }
    }));
    return response.Item;
};

const streamToBuffer = async (stream) => {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
};

const buildResponse = (statusCode, body = null, origin = null) => {
    const response = {
        statusCode: statusCode,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", // Set to the origin of your frontend
        }
    };
    if (body) {
        response.body = JSON.stringify(body);
    }
    return response;
};
