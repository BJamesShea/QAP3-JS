const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "D712666B9A46AC343B6B53C122E93",
    resave: false,
    saveUninitialized: true,
  })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const USERS = [
  {
    id: 1,
    username: "Kenobi",
    email: "admin@example.com",
    password: bcrypt.hashSync("admin123", SALT_ROUNDS), //In a database, you'd just store the hashes, but for
    // our purposes we'll hash these existing users when the
    // app loads
    role: "admin",
  },
  {
    id: 2,
    username: "RegularUser",
    email: "user@example.com",
    password: bcrypt.hashSync("user123", SALT_ROUNDS),
    role: "user", // Regular user
  },
];

// GET /login - Render login form
app.get("/login", (request, response) => {
  response.render("login");
});

// POST /login - Allows a user to login
app.post("/login", async (request, response) => {
  const { email, password } = request.body;

  if (!email || !password) {
    return response.render("login", { error: "Missing fields" });
  }

  const user = USERS.find((user) => user.email === email);
  if (!user) {
    return response.render("login", { error: "Invalid email or password" });
  }

  const isPassValid = await bcrypt.compare(password, user.password);
  if (!isPassValid) {
    return response.render("login", { error: "Invalid email or password" });
  }

  request.session.user = {
    id: user.id,
    username: user.username,
    role: user.role,
  };

  response.redirect("/landing");
});

// GET /signup - Render signup form
app.get("/signup", (request, response) => {
  response.render("signup");
});

// POST /signup - Allows a user to signup
app.post("/signup", async (request, response) => {
  const { email, username, password } = request.body;

  if (!email || !username || !password) {
    return response.render("signup", { error: "All fields are required." });
  }

  const emailInUse = USERS.some((user) => user.email === email);
  if (emailInUse) {
    return response.render("signup", { error: "Email is already registered." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS); //saltrounds is funny I feel like i'm in a C tier Angelina Jolie action movie. Saltrounds starring Armie Hammer as the saltman (because he eats people) (you put salt on meat) (im hilarious behave)

    const newUser = {
      id: USERS.length + 1,
      username,
      email,
      password: hashedPassword,
      role: "user",
    };

    USERS.push(newUser);

    response.redirect("/login");
  } catch (error) {
    console.log("Error during signup", error);
    response.render("signup", { error: "An erorr occured. Try again" });
  }
});

// GET / - Render index page or redirect to landing if logged in
app.get("/", (request, response) => {
  if (request.session.user) {
    return response.redirect("/landing");
  }
  response.render("index");
});

// GET /landing - Shows a welcome page for users, shows the names of all users if an admin
app.get("/landing", (request, response) => {
  const user = request.session.user;

  if (!user) {
    return response.redirect("/login");
  }

  if (user.role === "admin") {
    return response.render("landing", { user, users: USERS });
  }

  response.render("landing", { user });
});

app.get("/logout", (request, response) => {
  request.session.destroy((err) => {
    if (err) {
      console.error("Error during logout:", err);
      return response.redirect("/landing");
    }
    response.redirect("/");
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
