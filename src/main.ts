import "./style.css";
import { mountShell } from "./ui/shell";

const root = document.getElementById("app");
if (!root) throw new Error("App root not found");

mountShell(root);
