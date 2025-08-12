import React, { useState } from "react";

const TestIndex: React.FC = () => {
  const [test, setTest] = useState("Hello World");

  return (
    <div>
      <h1>{test}</h1>
      <button onClick={() => setTest("Button clicked!")}>
        Click me
      </button>
    </div>
  );
};

export default TestIndex;
