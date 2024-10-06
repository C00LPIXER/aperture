let croppieInstance;
let currentImageInput;

$(document).ready(() => {
  $("#imageInput1, #imageInput2, #imageInput3").on("change", function (e) {
    currentImageInput = e.target;
    if (currentImageInput.files && currentImageInput.files[0]) {
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
      .result({ type: "blob", size: "viewport" })
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
        url: "/admin/add_product/create",
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
  } else {
    clearError(price, "₹");
  }

  const originalPrice = document.querySelector('input[name="orginal_price"]');
  if (originalPrice.value.trim() === "") {
    displayError(originalPrice, "Regular price is required");
    isValid = false;
  } else {
    clearError(originalPrice, "₹");
  }

  const stock = document.querySelector('input[name="stock"]');
  if (stock.value.trim() === "") {
    displayError(stock, "Stock is required");
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

  // Validation for imageInput2
  if (imageInput2.files.length === 0) {
    displayError(imageInput2, "Please upload an image");
    isValid = false;
  } else {
    clearError(imageInput2);
  }

  // Validation for imageInput3
  if (imageInput3.files.length === 0) {
    displayError(imageInput3, "Please upload an image");
    isValid = false;
  } else {
    clearError(imageInput3);
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
function showToastError(message) {
  const toastBody = document.getElementById("toast-body-error");
  toastBody.textContent = message;

  const toastElement = document.getElementById("toast_error");
  const toast = new bootstrap.Toast(toastElement);
  toast.show();
}
