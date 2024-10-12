$(document).ready(function () {
  $("#loginForm").on("submit", function (e) {
    e.preventDefault();

    if (validateForm()) {
      const formData = $(this).serialize();

      $.ajax({
        type: "POST",
        url: "/login",
        data: formData,
        success: function (response) {
          if (response.success) {
            window.location.href = "/";
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

  const password = document.getElementById("password");
  if (password.value.trim() === "") {
    displayError(password, "Password is required");
    isValid = false;
  } else {
    clearError(password, "Password");
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
