require("dotenv").config();

const path = require("path");
const fs = require("fs");
const express = require("express");
const multer = require("multer");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();

const PORT = process.env.PORT || 5500;

const client =
  new MongoClient(process.env.MONGO_URI);


// Middleware

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true
  })
);

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);


// Upload folder

const uploadDir =
  path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {

  fs.mkdirSync(
    uploadDir,
    { recursive: true }
  );

}


// Multer

const storage =
  multer.diskStorage({

    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },

    filename: (req, file, cb) => {

      const name =
        Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname);

      cb(null, name);

    }

  });


const upload =
  multer({

    storage,

    limits: {
      files: 4,
      fileSize: 5 * 1024 * 1024
    }

  });


app.use(
  "/uploads",
  express.static(uploadDir)
);


// ============================
// SHOW ALL USERS
// ============================

app.get("/getUsers", async (req, res) => {

  try {

    const db =
      client.db("my_sample_db");

    const users =
      await db
        .collection("users")
        .find({})
        .sort({ _id: -1 })
        .toArray();

    res.json(users);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Error fetching users"
    });

  }

});


// ============================
// ADD USER
// ============================

app.post(
  "/addUser",
  upload.array("images", 4),
  async (req, res) => {

    try {

      const {
        name,
        email,
        password
      } = req.body;


      if (!name || !email || !password) {

        return res.status(400).json({
          message: "All fields are required"
        });

      }


      if (password.length < 6) {

        return res.status(400).json({
          message:
            "Password must be at least 6 characters"
        });

      }


      const images =
        (req.files || []).map(
          file => "/uploads/" + file.filename
        );


      const db =
        client.db("my_sample_db");


      const result =
        await db
          .collection("users")
          .insertOne({

            name,
            email,
            password,
            images,

            createdAt: new Date()

          });


      res.status(201).json({

        message:
          "User added successfully",

        id:
          result.insertedId

      });

    } catch (error) {

      console.log(error);

      res.status(500).json({

        message:
          "Error inserting user"

      });

    }

  }
);


// ============================
// GET SINGLE USER
// ============================

app.get(
  "/getUser/:id",
  async (req, res) => {

    try {

      const db =
        client.db("my_sample_db");


      const user =
        await db
          .collection("users")
          .findOne({

            _id:
              new ObjectId(req.params.id)

          });


      if (!user) {

        return res.status(404).json({

          message:
            "User not found"

        });

      }


      res.json(user);

    } catch (error) {

      console.log(error);

      res.status(500).json({

        message:
          "Error fetching user"

      });

    }

  }
);


// ============================
// UPDATE USER
// ============================

app.put(
  "/updateUser/:id",
  upload.array("images", 4),
  async (req, res) => {

    try {

      const {
        name,
        email,
        password
      } = req.body;


      const updateData = {

        name,
        email,

        updatedAt:
          new Date()

      };


      if (password) {

        if (password.length < 6) {

          return res.status(400).json({

            message:
              "Password must be at least 6 characters"

          });

        }


        updateData.password =
          password;

      }


      if (
        req.files &&
        req.files.length > 0
      ) {

        updateData.images =
          req.files.map(
            file =>
              "/uploads/" +
              file.filename
          );

      }


      const db =
        client.db("my_sample_db");


      const result =
        await db
          .collection("users")
          .updateOne(

            {
              _id:
                new ObjectId(
                  req.params.id
                )
            },

            {
              $set:
                updateData
            }

          );


      if (
        result.matchedCount === 0
      ) {

        return res.status(404).json({

          message:
            "User not found"

        });

      }


      res.json({

        message:
          "User updated successfully"

      });

    } catch (error) {

      console.log(error);

      res.status(500).json({

        message:
          "Error updating user"

      });

    }

  }
);


// ============================
// DELETE USER
// ============================

app.delete(
  "/deleteUser/:id",
  async (req, res) => {

    try {

      const db =
        client.db("my_sample_db");


      const collection =
        db.collection("users");


      const id =
        new ObjectId(
          req.params.id
        );


      const user =
        await collection.findOne({
          _id: id
        });


      if (!user) {

        return res.status(404).json({

          message:
            "User not found"

        });

      }


      await collection.deleteOne({
        _id: id
      });


      // Delete images

      if (user.images) {

        user.images.forEach(image => {

          const file =
            path.join(
              uploadDir,
              path.basename(image)
            );


          if (fs.existsSync(file)) {

            fs.unlinkSync(file);

          }

        });

      }


      res.json({

        message:
          "User deleted successfully"

      });

    } catch (error) {

      console.log(error);

      res.status(500).json({

        message:
          "Error deleting user"

      });

    }

  }
);


// ============================
// START SERVER
// ============================

async function startServer() {

  try {

    await client.connect();

    console.log(
      "MongoDB connected successfully"
    );


    app.listen(
      PORT,
      "0.0.0.0",
      () => {

        console.log(
          `Server running on http://localhost:${PORT}`
        );

      }
    );

  } catch (error) {

    console.log(
      "MongoDB connection error:",
      error.message
    );

  }

}


startServer();