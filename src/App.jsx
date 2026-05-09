import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import WeatherApp from "./components/WeatherApp";
import TodoApp from "./components/TodoApp";
import ExpenseTracker from "./components/ExpenseTracker";
import NotesApp from "./components/NotesApp";
import GithubSearch from "./components/GithubSearch";
import EcommerceStore from "./components/EcommerceStore";

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link> |{" "}
        <Link to="/weather">Weather</Link> |{" "}
        <Link to="/todo">Todo</Link> |{" "}
        <Link to="/expense">Expense</Link> |{" "}
        <Link to="/notes">Notes</Link> |{" "}
        <Link to="/github">Github</Link> |{" "}
        <Link to="/store">Store</Link>
      </nav>

      <Routes>
        <Route path="/" element={<h1>Home Page</h1>} />
        <Route path="/weather" element={<WeatherApp />} />
        <Route path="/todo" element={<TodoApp />} />
        <Route path="/expense" element={<ExpenseTracker />} />
        <Route path="/notes" element={<NotesApp />} />
        <Route path="/github" element={<GithubSearch />} />
        <Route path="/store" element={<EcommerceStore />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;