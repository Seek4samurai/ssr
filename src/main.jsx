import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Mesh from "./Mesh.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <div className="w-screen h-screen">
      <Mesh />
    </div>
  </StrictMode>
);

