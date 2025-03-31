let questions = {}; 

fetch('data.json')
  .then(response => response.json())
  .then(data => {
    questions = data.countries;
    init(); 
  })
  .catch(error => {
    console.error("Error fetching data:", error);
    alert("Data failed to load.");
  });

const backgroundImages = {
  India: 'assets/india.jpg',
  USA: 'assets/usa.jpg',
  UK: 'assets/uk.jpg',
  Australia: 'assets/australia.jpg'
};

function changeBackgroundImage(country) {
  const imageUrl = backgroundImages[country] || 'world_map.jpg';
  document.body.style.backgroundImage = `url('${imageUrl}')`;
}

function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = `; expires=${date.toUTCString()}`;
  }
  document.cookie = `${name}=${JSON.stringify(value)}${expires}; path=/`;
}

function getCookie(name) {
  const cookies = document.cookie.split("; ");
  for (let i = 0; i < cookies.length; i++) {
    const [cookieName, cookieValue] = cookies[i].split("=");
    if (cookieName === name) {
      return JSON.parse(cookieValue);
    }
  }
  return null;
}

let userSelections = getCookie("userSelections") || [];
let previousSelections = getCookie("previousSelections") || [];

const formContainer = document.getElementById("form-container");
const resetButton = document.getElementById("reset-button");
const previousSelectionsContainer = document.getElementById("previous-selections");

function createDropdown(options, question, index) {
  const select = document.createElement("select");
  select.setAttribute("id", `dropdown-${index}`);
  select.setAttribute("required", true);

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = `Select ${question}`;
  select.appendChild(defaultOption);

  options.forEach(option => {
    const opt = document.createElement("option");
    opt.value = option;
    opt.textContent = option;
    select.appendChild(opt);
  });

  function clearPreviousForm() {
    const existingForm = document.querySelector("#form-container div"); 
    if (existingForm) {
      existingForm.remove();
    }
  }

  select.addEventListener("change", (e) => {
    userSelections = userSelections.slice(0, index);
    userSelections[index] = e.target.value;
    setCookie("userSelections", userSelections, 1);
  
    if (index === 0) {
      changeBackgroundImage(e.target.value);
    }
  
    removeNextDropdowns(index);
    clearPreviousForm(); 
  
    const nextQuestion = NextQuestion(index, e.target.value);
    if (nextQuestion) {
      createDropdown(nextQuestion.options, nextQuestion.question, index + 1);
    } else {
      displaySelections();
      addUserDetailsFromForm();
    }
  });
  
  animateDropdown(select);
  formContainer.appendChild(select);
  select.scrollIntoView({ behavior: "smooth", block: "center" });
}

function NextQuestion(index, selectedValue) {
  if (index === 0) {
    return {
      question: "activity",
      options: questions[selectedValue].activities
    };
  } else if (index === 1) {
    const country = userSelections[0];
    return {
      question: selectedValue.toLowerCase(),
      options: Object.keys(questions[country][selectedValue])
    };
  } else if (index === 2) {
    const country = userSelections[0];
    const activity = userSelections[1];
    const options = questions[country][activity][selectedValue];

    return selectedValue === "Business" 
      ? { question: "business", options: ["Business", ...options] } 
      : { question: "details", options: options };
  } else if (index >= 3 && userSelections[index - 1] === "Business") {
    return selectedValue === "Business" 
      ? { question: "business", options: ["Business", ...questions[userSelections[0]][userSelections[1]]["Business"]] }
      : null;
  }
  return null;
}

function removeNextDropdowns(index) {
  const dropdowns = formContainer.querySelectorAll("select");
  dropdowns.forEach((dropdown, i) => {
    if (i > index) {
      formContainer.removeChild(dropdown);
    }
  });
}

function animateDropdown(element) {
  let opacity = 0;
  element.style.opacity = opacity;
  element.style.transform = "translateY(-20px)";

  const fadeIn = () => {
    opacity += 0.05;
    element.style.opacity = opacity;
    element.style.transform = `translateY(${-20 + opacity * 20}px)`;

    if (opacity < 1) {
      requestAnimationFrame(fadeIn);
    }
  };

  requestAnimationFrame(fadeIn);
}

function displaySelections() {
  const selections = document.createElement("div");
  selections.classList.add("selection-display");

  const heading = document.createElement("h3");
  heading.textContent = "Your Selections:";
  selections.appendChild(heading);

  const paragraph = document.createElement("p");
  paragraph.textContent = userSelections.join(", ");
  selections.appendChild(paragraph);

  formContainer.appendChild(selections);
  selections.scrollIntoView({ behavior: "smooth", block: "center" });
}

function addUserDetailsFromForm() {
  if (document.getElementById("user-details-form")) return;

  const form = document.createElement("div");
  form.setAttribute("id", "user-details-form");

  const heading = document.createElement("h3");
  heading.textContent = "Your Details";
  form.appendChild(heading);

  const nameInput = document.createElement("input");
  nameInput.setAttribute("type", "text");
  nameInput.setAttribute("id", "name");
  nameInput.setAttribute("placeholder", "Your Name");
  nameInput.setAttribute("required", true);
  form.appendChild(nameInput);

  const emailInput = document.createElement("input");
  emailInput.setAttribute("type", "email");
  emailInput.setAttribute("id", "email");
  emailInput.setAttribute("placeholder", "Your Email");
  emailInput.setAttribute("required", true);
  form.appendChild(emailInput);

  const submitButton = document.createElement("button");
  submitButton.setAttribute("id", "submit-details");
  submitButton.textContent = "Submit";
  form.appendChild(submitButton);

  formContainer.appendChild(form);


  const savedName = localStorage.getItem("userName");
  const savedEmail = localStorage.getItem("userEmail");
  if (savedName) nameInput.value = savedName;
  if (savedEmail) emailInput.value = savedEmail;

  submitButton.addEventListener("click", () => {
    const name = nameInput.value;
    const email = emailInput.value;

    if (name && email) {
      const userData = { name, email, selections: userSelections };
      previousSelections.push(userData);
      setCookie("previousSelections", previousSelections, 7);

      localStorage.setItem("userName", name);
      localStorage.setItem("userEmail", email);

      alert("Thank you for submitting your details.");
      location.reload();
    } else {
      alert("Please fill in all fields in the form!");
    }
  });
}

function resetFormButton() {
  formContainer.textContent = ""; 
  userSelections = [];
  setCookie("userSelections", [], -1);
  createDropdown(Object.keys(questions), "country", 0);
  changeBackgroundImage('assets/world_map.jpg');
  location.reload();
}

function displayPreviousResponses() {
  previousSelectionsContainer.textContent = ""; 

  const heading = document.createElement("h3");
  heading.textContent = "Previous Selections:";
  previousSelectionsContainer.appendChild(heading);

  previousSelections.forEach(selection => {
    const div = document.createElement("div");
    div.classList.add("selection-display");

    const namePara = document.createElement("p");
    const nameStrong = document.createElement("strong");
    nameStrong.textContent = "Name: ";
    namePara.appendChild(nameStrong);
    namePara.appendChild(document.createTextNode(selection.name));
    div.appendChild(namePara);

    const selectionsPara = document.createElement("p");
    const selectionsStrong = document.createElement("strong");
    selectionsStrong.textContent = "Selected Options: ";
    selectionsPara.appendChild(selectionsStrong);
    selectionsPara.appendChild(document.createTextNode(selection.selections.join(", ")));
    div.appendChild(selectionsPara);

    previousSelectionsContainer.appendChild(div);
  });
}

function init() {
  formContainer.textContent = "";
  createDropdown(Object.keys(questions), "country", 0);
  displayPreviousResponses();
}

resetButton.addEventListener("click", resetFormButton);
init();
