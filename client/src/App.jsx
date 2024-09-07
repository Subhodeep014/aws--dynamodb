import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function FacialRecognition() {
  const [image, setImage] = useState(null);
  const [visitorName, setVisitorName] = useState('placeholder.jpg');
  const [uploadResultMessage, setUploadResultMessage] = useState('Please upload an image to authenticate');
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sendImage = async (e) => {
    e.preventDefault();
    if (!image) {
      setUploadResultMessage('Please select an image first');
      return;
    }

    setIsLoading(true);
    setVisitorName(image.name);
    console.log(image.name)
    const visitorImageName = uuidv4();

    try {
      // Upload image to S3
      const response=await fetch(`https://aa6dargym4.execute-api.ap-south-1.amazonaws.com/devv/visitor-image-storage-v1/${visitorImageName}.jpeg`, {
        method: "PUT",
        headers: {
          'Content-Type': 'image/jpeg'
        },
        body: image,
      })

      
      .then(async()=>{
        // Authenticate
        const response = await authenticate(visitorImageName);
        
        if (response.Message === 'Success') {
          setIsAuth(true);
          setUploadResultMessage(`Hi ${response.firstName} ${response.lastName}, welcome to work!`);
        } else {
          setIsAuth(false);
          setUploadResultMessage('Authentication Failed: This person is not an employee.');
        }
      })


    } catch (error) {
      setIsAuth(false);
      setUploadResultMessage('There was an error during the authentication process. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const authenticate = async (visitorImageName) => {
    const requestUrl = `https://aa6dargym4.execute-api.ap-south-1.amazonaws.com/devv/employee?objectKey=${encodeURIComponent(visitorImageName)}.jpeg`
    console.log("fetching")
    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        'Accept': "application/json",
        'Content-Type': "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Facial Recognition</h2>
      <form onSubmit={sendImage} className="mb-4">
        <input
          type="file"
          name='image'
          onChange={e => setImage(e.target.files[0])}
          className="mb-2"
        />
        <button
          type='submit'
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {isLoading ? 'Authenticating...' : 'Authenticate'}
        </button>
      </form>
      <div className={`mb-4 ${isAuth ? 'text-green-600' : 'text-red-600'}`}>
        {uploadResultMessage}
      </div>
      {image && (
        <img
          src={URL.createObjectURL(image)}
          alt="Visitor"
          className="w-64 h-64 object-cover"
        />
      )}
    </div>
  );
}