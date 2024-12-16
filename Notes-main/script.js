const addBox = document.querySelector(".add-box"),
  popupBox = document.querySelector(".popup-box"),
  popupTitle = popupBox.querySelector("header p"),
  closeIcon = popupBox.querySelector("header i"),
  titleInput = popupBox.querySelector("input"),
  descInput = popupBox.querySelector("textarea"),
  reminderInput = popupBox.querySelector(".reminder input"),
  addButton = popupBox.querySelector("button");

const months = ["January", "February", "March", "April", "May", "June", "July",
  "August", "September", "October", "November", "December"];

let isUpdate = false, updateId;

// Show popup for adding a new note
addBox.addEventListener("click", () => {
  popupTitle.innerText = "Add a New Note";
  addButton.innerText = "Add Note";
  popupBox.classList.add("show");
  document.body.style.overflow = "hidden";
  titleInput.focus();
});

// Close popup
closeIcon.addEventListener("click", () => {
  isUpdate = false;
  titleInput.value = descInput.value = reminderInput.value = "";
  popupBox.classList.remove("show");
  document.body.style.overflow = "auto";
});

// Show existing notes
function showNotes() {
  chrome.storage.local.get({ notes: [] }, (data) => {
    const notes = data.notes;
    const notesContainer = document.querySelector(".notes");
    notesContainer.innerHTML = ""; // Clear existing notes

    notes.forEach((note, id) => {
      const noteHTML = `
        <div class="note" data-id="${id}">
          <h3>${note.title}</h3>
          <p>${note.description.replaceAll("\n", "<br>")}</p>
          <small>${note.date}</small>
          <button class="edit-btn" onclick="editNote(${id})">Edit</button>
          <button class="delete-btn" onclick="deleteNote(${id})">Delete</button>
        </div>`;
      notesContainer.insertAdjacentHTML("beforeend", noteHTML);
    });
  });
}

// Add or update a note
addButton.addEventListener("click", (e) => {
  e.preventDefault();

  const title = titleInput.value.trim();
  const description = descInput.value.trim();
  const reminderTime = reminderInput.value.trim();

  if (!title && !description) {
    alert("Please add a title or description.");
    return;
  }

  const currentDate = new Date();
  const formattedDate = `${months[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
  const noteInfo = { title, description, date: formattedDate, reminder: reminderTime };

  chrome.storage.local.get({ notes: [] }, (data) => {
    const notes = data.notes;

    if (isUpdate) {
      notes[updateId] = noteInfo;
      isUpdate = false;
    } else {
      notes.push(noteInfo);
    }

    chrome.storage.local.set({ notes }, () => {
      showNotes();
      if (reminderTime) scheduleReminder(noteInfo);
      closeIcon.click(); // Close popup
    });
  });
});

// Edit an existing note
function editNote(noteId) {
  chrome.storage.local.get({ notes: [] }, (data) => {
    const note = data.notes[noteId];
    if (!note) return;

    updateId = noteId;
    isUpdate = true;

    popupTitle.innerText = "Edit Note";
    addButton.innerText = "Update Note";
    titleInput.value = note.title;
    descInput.value = note.description.replaceAll("<br>", "\n");
    reminderInput.value = note.reminder || "";

    popupBox.classList.add("show");
    document.body.style.overflow = "hidden";
  });
}

// Delete a note
function deleteNote(noteId) {
  if (!confirm("Are you sure you want to delete this note?")) return;

  chrome.storage.local.get({ notes: [] }, (data) => {
    const notes = data.notes;
    notes.splice(noteId, 1);

    chrome.storage.local.set({ notes }, () => {
      showNotes();
    });
  });
}

// Schedule a reminder notification
function scheduleReminder(note) {
  const reminderTime = new Date(note.reminder).getTime();
  const currentTime = new Date().getTime();
  const timeDiff = reminderTime - currentTime;

  if (timeDiff > 0) {
    setTimeout(() => {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "Reminder",
        message: `Don't forget: ${note.title}`,
      });
    }, timeDiff);
  }
}

// Load existing notes on page load
showNotes();