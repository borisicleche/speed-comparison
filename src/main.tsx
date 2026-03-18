import ReactDOM from "react-dom/client";

import { App } from "./app/App";
import "./styles/global.scss";

const rootNode = document.getElementById("root");

if (rootNode) {
  ReactDOM.createRoot(rootNode).render(<App />);
}
