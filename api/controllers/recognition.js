import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { RekognitionClient, SearchFacesByImageCommand } from "@aws-sdk/client-rekognition";