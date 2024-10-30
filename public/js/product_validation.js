let croppieInstance;
let currentImageInput;

$(document).ready(() => {
  $("#imageInput1, #imageInput2, #imageInput3").on("change", function (e) {
    currentImageInput = e.target;

    if (
      validateImage(currentImageInput) &&
      currentImageInput.files &&
      currentImageInput.files[0]
    ) {
      const reader = new FileReader();
      reader.onload = function (e) {
        if (croppieInstance) {
          croppieInstance.destroy();
        }

        croppieInstance = new Croppie(
          document.getElementById("croppieContainer"),
          {
            viewport: { width: 250, height: 200, type: "square" },
            boundary: { width: 300, height: 300 },
            showZoomer: true,
            enableExif: true,
          }
        );

        croppieInstance.bind({
          url: e.target.result,
        });

        $("#cropModal").modal("show");
      };
      reader.readAsDataURL(currentImageInput.files[0]);
    }
  });

  $("#cropImageBtn").on("click", function () {
    croppieInstance
      .result({
        type: "blob",
        size: { width: 800, height: 640 },
        quality: 1,
      })
      .then(function (croppedImageBlob) {
        const dataTransfer = new DataTransfer();
        const croppedFile = new File(
          [croppedImageBlob],
          currentImageInput.files[0].name,
          { type: croppedImageBlob.type }
        );
        dataTransfer.items.add(croppedFile);
        currentImageInput.files = dataTransfer.files;

        $("#cropModal").modal("hide");
      });
  });

  $("#cancelCropBtn").on("click", function () {
    if (croppieInstance) {
      croppieInstance.destroy();
      croppieInstance = null;
    }
    $("#cropModal").modal("hide");

    if (currentImageInput) {
      currentImageInput.value = "";
      currentImageInput.files = new FileList();
    }
  });
});

$(document).ready(() => {
  $("#addProductForm").on("submit", function (e) {
    e.preventDefault();

    if (validateForm()) {
      const formData = new FormData(this);

      $.ajax({
        type: "POST",
        url: "/admin/add_product",
        data: formData,
        contentType: false,
        processData: false,
        success: (response) => {
          if (response.success) {
            showToast(response.message);
            $("#addProductForm")[0].reset();
          } else {
            showToastError(response.message);
          }
        },
        error: () => {
          showToast("An error occurred. Please try again.");
        },
      });
    }
  });
});

function validateForm() {
  let isValid = true;

  const positiveNumberPattern = /^(?!0)([0-9]+(\.[0-9]+)?|[0-9]*\.[0-9]+)$/;
  const nonNegativeStockPattern = /^(0|[1-9][0-9]*)$/;

  const name = document.getElementById("product_name");
if (name.value.trim() === "") {
  displayError(name, "Product title is required");
  isValid = false;
} else {
  clearError(name, "Type here");
}

const description = document.getElementById("description");
if (description.value.trim() === "") {
  displayError(description, "Full description is required");
  isValid = false;
} else {
  clearError(description, "Type here");
}

const price = document.querySelector('input[name="price"]');
if (price.value.trim() === "") {
  displayError(price, "Promotional price is required");
  isValid = false;
} else if (!positiveNumberPattern.test(price.value.trim())) {
  displayError(price, "Promotional price must be a positive number above 0");
  isValid = false;
} else {
  clearError(price, "₹");
}

const originalPrice = document.querySelector('input[name="orginal_price"]');
if (originalPrice.value.trim() === "") {
  displayError(originalPrice, "Regular price is required");
  isValid = false;
} else if (!positiveNumberPattern.test(originalPrice.value.trim())) {
  displayError(originalPrice, "Regular price must be a positive number above 0");
  isValid = false;
} else {
  clearError(originalPrice, "₹");
}

const stock = document.querySelector('input[name="stock"]');
if (stock.value.trim() === "") {
  displayError(stock, "Stock is required");
  isValid = false;
} else if (!nonNegativeStockPattern.test(stock.value.trim())) {
  displayError(stock, "Stock must be a non-negative integer (0 or positive)");
  isValid = false;
} else {
  clearError(stock, "Enter stock");
}

const category = document.querySelector('select[name="category"]');
if (category.value === "") {
  displayError(category, "Category is required");
  isValid = false;
} else {
  clearError(category, "Select Category");
}

const brand = document.querySelector('select[name="brands"]');
if (brand.value === "") {
  displayError(brand, "Brand is required");
  isValid = false;
} else {
  clearError(brand, "Select Brand");
}

const highlights = document.querySelector('input[name="highlights"]');
if (highlights.value.trim() === "") {
  displayError(highlights, "Tags are required");
  isValid = false;
} else {
  clearError(highlights, "Enter highlights");
}

  const imageInput1 = document.getElementById("imageInput1");
  const imageInput2 = document.getElementById("imageInput2");
  const imageInput3 = document.getElementById("imageInput3");

  if (imageInput1.files.length === 0) {
    displayError(imageInput1, "Please upload an image");
    isValid = false;
  } else {
    clearError(imageInput1);
  }

  if (imageInput2.files.length === 0) {
    displayError(imageInput2, "Please upload an image");
    isValid = false;
  } else {
    clearError(imageInput2);
  }

  if (imageInput3.files.length === 0) {
    displayError(imageInput3, "Please upload an image");
    isValid = false;
  } else {
    clearError(imageInput3);
  }

  if (!validateImage(imageInput1)) {
    isValid = false;
  }

  if (!validateImage(imageInput2)) {
    isValid = false;
  }

  if (!validateImage(imageInput3)) {
    isValid = false;
  }

  return isValid;
}

function validateImage(imageInput) {
  const maxSize = 5 * 1024 * 1024;
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (imageInput.files.length === 0) {
    displayErrorMessage(imageInput, "Please upload an image");
    return false;
  }

  const file = imageInput.files[0];

  if (file.size > maxSize) {
    displayErrorMessage(imageInput, "File size exceeds 5MB");
    return false;
  }

  if (!allowedTypes.includes(file.type)) {
    displayErrorMessage(
      imageInput,
      "Invalid file type. Please upload a jpg or png image."
    );
    return false;
  }

  clearErrorMessage(imageInput);
  return true;
}

function displayErrorMessage(inputElement, message) {
  let errorElement = inputElement.nextElementSibling;

  if (!errorElement || errorElement.tagName.toLowerCase() !== "p") {
    errorElement = document.createElement("p");
    errorElement.classList.add("error-message");
    inputElement.parentNode.insertBefore(
      errorElement,
      inputElement.nextSibling
    );
  }

  errorElement.textContent = message;
}

function clearErrorMessage(inputElement) {
  let errorElement = inputElement.nextElementSibling;

  if (errorElement && errorElement.tagName.toLowerCase() === "p") {
    errorElement.textContent = "";
  }
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

function showToastError(message) {
  const toastBody = document.getElementById("toast-body-error");
  toastBody.textContent = message;

  const toastElement = document.getElementById("toast_error");
  const toast = new bootstrap.Toast(toastElement);
  toast.show();
}
