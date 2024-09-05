import React, { useState } from 'react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [profileImage, setProfileImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('email', email);
    formData.append('fullName', fullName);
    if (profileImage) formData.append('profileImage', profileImage);

    try {
      const response = await fetch('/api/register/user', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        alert('User created successfully!');
        // Optionally reset form fields
        setEmail('');
        setFullName('');
        setProfileImage(null);
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Full Name"
        required
      />
      <input
        type="file"
        onChange={(e) => setProfileImage(e.target.files[0])}
        accept="image/*"
        required
      />
      <button type="submit">Submit</button>
    </form>
  );
}