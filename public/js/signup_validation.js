  $(document).ready(function () {
    $("#signupForm").on("submit", function (event) {
      event.preventDefault();
  
      if (validateForm()) {
        const formData = $(this).serialize();
  
        $.ajax({
          type: "POST",
          url: "/signup",
          data: formData,
          success: function (response) {
            if (response.success) {
              window.location.href = "/verification";
            } else {
              showToast(response.message);
            }
          },
          error: function () {
            showToast("An error occurred. Please try again.");
          },
        });
      }
    });
  });

  $("#toggle-password").on("click", function () {
    const passwordField = $("#password");
    const passwordIcon = $("#password-icon");
  
    if (passwordField.attr("type") === "password") {
      passwordField.attr("type", "text");
      passwordIcon.removeClass("fa-eye").addClass("fa-eye-slash");
    } else {
      passwordField.attr("type", "password");
      passwordIcon.removeClass("fa-eye-slash").addClass("fa-eye");
    }
  });

function validateForm() {
  let isValid = true;

  const firstName = document.getElementById("firstName");
  const namePattern = /^[A-Za-z]{2,30}$/;

  if (firstName.value.trim() === "") {
    displayError(firstName, "First Name is required");
    isValid = false;
  }else if (!namePattern.test(firstName.value)) {
    displayError(firstName, "Enter a valid name");
    isValid = false;
  } else {
    clearError(firstName, "First Name");
  }

  // Last Name validation
  const lastName = document.getElementById("lastName");

  if (lastName.value.trim() === "") {
    displayError(lastName, "Last Name is required");
    isValid = false;
  }else if (!namePattern.test(lastName.value)) {
    displayError(lastName, "Enter a valid name");
    isValid = false;
  } else {
    clearError(lastName, "Last Name");
  }

  // Email validation
  const email = document.getElementById("email");
  const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;

  if (email.value.trim() === "") {
    displayError(email, "Email is required");
    isValid = false;
  } else if (!emailPattern.test(email.value)) {
    displayError(email, "Enter a valid email");
    isValid = false;
  } else {
    clearError(email, "Email");
  }

  // Password validation
  const password = document.getElementById("password");
  if (password.value.trim() === "") {
    displayError(password, "Password is required");
    isValid = false;
  } else {
    clearError(password, "Password");
  }

  // Confirm Password validation
  const confirmPassword = document.getElementById("confirmPassword");
  if (confirmPassword.value.trim() === "") {
    displayError(confirmPassword, "Confirm Password is required");
    isValid = false;
  } else if (confirmPassword.value.trim() !== password.value.trim()) {
    displayError(confirmPassword, "Passwords do not match");
    isValid = false;
  } else {
    clearError(confirmPassword, "Confirm Password");
  }

  return isValid;
}

function displayError(inputField, errorMessage) {
  inputField.classList.add("error");
  inputField.value = "";
  inputField.placeholder = errorMessage;
}

function clearError(inputField, originalPlaceholder) {
  inputField.classList.remove("error");
  inputField.placeholder = originalPlaceholder;
}

function showToast(message) {
  const toastBody = document.getElementById("toast-body");
  toastBody.textContent = message;

  const toastElement = document.getElementById("toast");
  const toast = new bootstrap.Toast(toastElement);
  toast.show();
}