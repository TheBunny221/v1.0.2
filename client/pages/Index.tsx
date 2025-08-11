import React from "react";

const Index: React.FC = () => {
  return (
    <div style={{ padding: "20px", background: "white", minHeight: "100vh" }}>
      <h1 style={{ color: "black", fontSize: "24px", marginBottom: "20px" }}>
        Cochin Smart City - Home Page
      </h1>
      <p style={{ color: "black", fontSize: "16px", marginBottom: "10px" }}>
        Welcome to the Cochin Smart City Complaint Management System.
      </p>
      <p style={{ color: "black", fontSize: "16px", marginBottom: "20px" }}>
        This is a test to verify the page is loading correctly.
      </p>
      <div style={{ padding: "20px", background: "#f0f0f0", border: "1px solid #ccc" }}>
        <h2 style={{ color: "black", fontSize: "18px", marginBottom: "10px" }}>
          Quick Actions
        </h2>
        <ul style={{ color: "black" }}>
          <li>Submit a new complaint</li>
          <li>Track existing complaint</li>
          <li>Login to your account</li>
          <li>Register new account</li>
        </ul>
      </div>
    </div>
  );
};

export default Index;
