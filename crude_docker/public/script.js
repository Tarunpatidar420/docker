// ==============================
// ADD USER
// ==============================

const userForm = document.getElementById("userForm");

if (userForm) {

  userForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const files = document.getElementById("images").files;

    if (files.length > 4) {
      alert("Maximum 4 images allowed");
      return;
    }

    try {

      const response = await fetch("/addUser", {
        method: "POST",
        body: new FormData(userForm)
      });

      const data = await response.json();

      alert(data.message);

      if (response.ok) {
        userForm.reset();
        document.getElementById("preview").innerHTML = "";
      }

    } catch (error) {

      console.log(error);
      alert("Error adding user");

    }

  });

}


// ==============================
// IMAGE PREVIEW
// ==============================

const images = document.getElementById("images");

if (images) {

  images.addEventListener("change", () => {

    const preview = document.getElementById("preview");

    preview.innerHTML = "";

    if (images.files.length > 4) {

      alert("Maximum 4 images allowed");

      images.value = "";

      return;
    }

    [...images.files].forEach(file => {

      const img = document.createElement("img");

      img.src = URL.createObjectURL(file);

      img.width = 100;
      img.height = 100;

      img.style.objectFit = "cover";
      img.style.margin = "5px";

      preview.appendChild(img);

    });

  });

}


// ==============================
// SHOW USERS
// ==============================

async function loadUsers() {

  const users = document.getElementById("users");

  if (!users) return;

  try {

    const response = await fetch("/getUsers");

    const data = await response.json();

    users.innerHTML = "";

    if (data.length === 0) {

      users.innerHTML = "<h3>No users found</h3>";

      return;
    }

    data.forEach(user => {

      const div = document.createElement("div");

      div.className = "user-card";


      let imagesHTML = "";

      if (user.images && user.images.length > 0) {

        imagesHTML = user.images.map(image => `
          
          <img
            src="${image}"
            width="100"
            height="100"
            style="object-fit:cover;margin:5px"
          >

        `).join("");

      }


      div.innerHTML = `

        <h3>${user.name || ""}</h3>

        <p>
          Email: ${user.email || ""}
        </p>

        ${imagesHTML}

        <br>

        <button
          onclick="editUser('${user._id}')"
        >
          Edit
        </button>

        <button
          onclick="deleteUser('${user._id}')"
        >
          Delete
        </button>

      `;


      users.appendChild(div);

    });

  } catch (error) {

    console.log(error);

    users.innerHTML =
      "<p>Error loading users</p>";

  }

}


// ==============================
// EDIT BUTTON
// ==============================

function editUser(id) {

  window.location.href =
    `/edit.html?id=${id}`;

}


// ==============================
// EDIT / UPDATE
// ==============================

const editForm =
  document.getElementById("editForm");


if (editForm) {

  const id =
    new URLSearchParams(
      window.location.search
    ).get("id");


  // Load existing user

  fetch(`/getUser/${id}`)
    .then(response => response.json())
    .then(user => {

      if (user.name) {

        document.getElementById("name").value =
          user.name;

      }

      if (user.email) {

        document.getElementById("email").value =
          user.email;

      }

    })
    .catch(error => {

      console.log(error);

      alert("Error loading user");

    });


  // Update user

  editForm.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();


      const files =
        document.getElementById("images").files;


      if (files.length > 4) {

        alert("Maximum 4 images allowed");

        return;

      }


      try {

        const formData =
          new FormData();


        const name =
          document.getElementById("name").value;


        const email =
          document.getElementById("email").value;


        const password =
          document.getElementById("password").value;


        formData.append(
          "name",
          name
        );


        formData.append(
          "email",
          email
        );


        if (password) {

          formData.append(
            "password",
            password
          );

        }


        for (const file of files) {

          formData.append(
            "images",
            file
          );

        }


        const response =
          await fetch(
            `/updateUser/${id}`,
            {
              method: "PUT",
              body: formData
            }
          );


        const data =
          await response.json();


        alert(data.message);


        if (response.ok) {

          window.location.href =
            "/show.html";

        }

      } catch (error) {

        console.log(error);

        alert("Update failed");

      }

    }
  );

}


// ==============================
// DELETE USER
// ==============================

async function deleteUser(id) {

  if (!confirm("Delete this user?")) {

    return;

  }


  try {

    const response =
      await fetch(
        `/deleteUser/${id}`,
        {
          method: "DELETE"
        }
      );


    const data =
      await response.json();


    alert(data.message);


    if (response.ok) {

      loadUsers();

    }

  } catch (error) {

    console.log(error);

    alert("Delete failed");

  }

}


// ==============================
// PAGE LOAD
// ==============================

loadUsers();