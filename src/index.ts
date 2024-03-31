
import express, { Application, Request, Response, NextFunction } from "express";
import path from "path";
import LogInCollection from "./mongo";
import jwt, { Jwt, JwtPayload } from "jsonwebtoken";
import bcrypt from "bcrypt";
import session from "express-session";

// Add this line before defining your routes


const app: Application = express();
const port: number = parseInt(process.env.PORT || '3000', 10);
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const fs = require('fs');
const credentialsPath = path.join(__dirname, 'credentials.json');
const credentials = fs.readFileSync(credentialsPath, 'utf8');
const parsedCredentials = JSON.parse(credentials);
const { client_secret, client_id, redirect_uris } = parsedCredentials.web;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);


const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/gmail.send']
});
console.log('Authorize this app by visiting this URL:', authUrl);


interface CustomRequest extends Request {
  headers: any;
  user?: JwtPayload;
}


const secretKey: string = "82481";
const templatePath: string = path.join(__dirname, "../templates");
const publicPath: string = path.join(__dirname, "../assets/css/");

declare module 'express-session' {
  interface SessionData {
    user: any; // Adjust the type of 'user' based on your user data structure
  }
}
app.use(session({
  secret: "82481",
  resave: false,
  saveUninitialized: false
}));
app.use("/assets/css", express.static(path.join(__dirname, "../assets/css")));
app.use("/assets/images", express.static(path.join(__dirname, "../assets/images")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "hbs");
app.set("views", templatePath);
app.use(express.static(publicPath));

function authenticate(req: CustomRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization;

  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
  }

  try {
   // const decodedToken = jwt.verify(token, secretKey) as Jwt & JwtPayload;
   if (token) {
    const decodedToken = jwt.verify(token, secretKey) as Jwt & JwtPayload;
    req.user = decodedToken;
    // do something with decodedToken
  } else {
    // handle case where token is undefined
  }
  
    
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid Token" });
  }
}

app.get("/signup", (req: Request, res: Response) => {
  res.render("signup");
});

app.get("/signin", (req: Request, res: Response) => {
    res.render("signin");
  });

app.get("/", (req: Request, res: Response) => {
  res.render("index");
});

app.post("/signup", async (req: Request, res: Response) => {
  try {
    const checking = await LogInCollection.findOne({ name: req.body.name });

    if (checking) {
      res.send('<script>alert("User Data Exists"); window.location.href="/signup";</script>');
    } else {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const data = {
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
      };

      const createdUser = await LogInCollection.create(data);
      const token = jwt.sign({ id: createdUser._id }, secretKey);
      res.send('<script>alert("User Registered Successfully"); window.location.href="/signin";</script>');
      //res.render("signin");
     // res.status(201).json({ token });
     
    }
  } catch (error) {
    res.send("An error occurred " + error);
  }
});

app.post("/signin", async (req: Request, res: Response) => {
  try {
    const check = await LogInCollection.findOne({ email: req.body.email });

    if (!check) {
      res.send('<script>alert("User Not Registered"); window.location.href="/signin";</script>');
    } else {
      const passwordMatch = await bcrypt.compare(
        req.body.password,
        check.password
      );
      if (passwordMatch) {
        const token = jwt.sign({ id: check._id }, secretKey);
       req.session.user = check;
       res.redirect("/user");

      } else {
        res.send("Incorrect password");
      }
    }
  } catch (e) {
    res.send("Wrong details " + e);
  }
});


app.get("/user", (req: Request, res: Response) => {
  const user = req.session.user;
  res.render("index", { user });
});

app.get("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }
    res.redirect("/signin");
  });
});




/*

app.get('/auth/google/callback', async (req, res) => {
try{
  const code = req.query.code;
  if (!code) {
    throw new Error('Missing code parameter');
  }
  const { tokens } = await oAuth2Client.getToken(code);
 
  oAuth2Client.setCredentials(tokens);

  // Save the tokens to use for future API calls
  fs.writeFileSync('/src/credentials.json', JSON.stringify(tokens));

 res.redirect("message");
}

catch (error) {
  console.error('Error in /auth/google/callback:', error);
  res.status(500).send('An error occurred during authentication.'+ error);
}
  // Redirect to the desired page after successful authentication
});



app.post("/message", async (req: Request, res: Response) =>{

  const { fullName, email, phone, message } = req.body;

  try {
    // Create a SMTP transporter using Gmail SMTP settings
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'tiaorservices@gmail.com', // Replace with your Gmail email address
        pass: '123@Qwerty' // Replace with your Gmail password or an application-specific password
      }
    });

    // Set up email data
    const mailOptions = {
      from: 'tiaorservices@gmail.com', // Replace with your Gmail email address
      to: 'jayaram12141@gmail.com', // Replace with the recipient email address
      subject: 'New Message from Feedback Contact form',
      html: `
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong> ${message}</p>
      `
    };

    // Send email
   
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    res.status(200).send('Contact form submitted successfully!');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while sending the email.' + error);
  }


});
*/
app.get("/protected", authenticate, (req: CustomRequest, res: Response) => {
  res.send("This is a protected route");
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

