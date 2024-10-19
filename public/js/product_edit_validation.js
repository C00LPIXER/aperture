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

function removeImgae(imgid, id) {
  swal(
    {
      title: "Are you sure?",
      text: "Once deleted, you will not be able to recover this image!",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    },
    function (isConfirm) {
      if (isConfirm) {
        $.ajax({
          type: "Delete",
          url: "/admin/edit_product/image",
          data: { imgid: imgid, id: id },
          success: (response) => {
            if (response.success) {
              showToast(response.message);
              window.location.href = `/admin/edit_product/${id}`;
            } else {
              showToastError(response.message);
            }
          },
          error: () => {
            showToastError("An error occurred while deleting the image.");
          },
        });
      }
    }
  );
}

$(document).ready(() => {
  $("#ProductEditForm").on("submit", function (e) {
    e.preventDefault();

    if (validateForm()) {
      const formData = new FormData(this);

      $.ajax({
        type: "PUT",
        url: "/admin/edit_product",
        data: formData,
        contentType: false,
        processData: false,
        success: function (response) {
          if (response.success) {
            showToast(response.message);
            window.location.href = "/admin/products";
          } else {
            showToastError(response.message);
          }
        },
        error: function () {
          showToast("An error occurred. Please try again.");
        },
      });
    }
  });
});

function validateForm() {
  let isValid = true;
  let imageChanged = false;

  const originalName = document
    .getElementById("product_name")
    ?.getAttribute("data-original");
  const originalDescription = document
    .getElementById("description")
    ?.getAttribute("data-original");
  const originalListingPrice = document
    .getElementById("price")
    ?.getAttribute("data-original");
  const originalRegularPrice = document
    .getElementById("orginal_price")
    ?.getAttribute("data-original");
  const originalCategory = document
    .getElementById("category")
    ?.getAttribute("data-original");
  const originalBrand = document
    .getElementById("brands")
    ?.getAttribute("data-original");
  const originalStock = document
    .getElementById("stock")
    ?.getAttribute("data-original");
  const originalHighlights = document
    .getElementById("highlights")
    ?.getAttribute("data-original");

  const name = document.getElementById("product_name");
  const description = document.getElementById("description");
  const price = document.getElementById("price");
  const originalPrice = document.getElementById("orginal_price");
  const stock = document.getElementById("stock");
  const category = document.getElementById("category");
  const brand = document.getElementById("brands");
  const highlights = document.getElementById("highlights");

  const nameChanged = name.value !== originalName;
  const descriptionChanged = description.value !== originalDescription;
  const priceChanged = price.value !== originalListingPrice;
  const originalPriceChanged = originalPrice.value !== originalRegularPrice;
  const categoryChanged =
    category.options[category.selectedIndex].text !== originalCategory;
  const brandChanged =
    brand.options[brand.selectedIndex].text !== originalBrand;
  const stockChanged = stock.value !== originalStock;
  const highlightsChanged = highlights.value !== originalHighlights;

  const imageInput1 = document.getElementById("imageInput1");
  const imageInput2 = document.getElementById("imageInput2");
  const imageInput3 = document.getElementById("imageInput3");

  if (
    imageInput1.files.length > 0 ||
    imageInput2.files.length > 0 ||
    imageInput3.files.length > 0
  ) {
    imageChanged = true;
  }

  if (
    !nameChanged &&
    !descriptionChanged &&
    !priceChanged &&
    !categoryChanged &&
    !brandChanged &&
    !originalPriceChanged &&
    !stockChanged &&
    !highlightsChanged &&
    !imageChanged
  ) {
    showToastError("No changes made");
    isValid = false;
  }

  // Perform field-specific validations
  if (name.value.trim() === "") {
    displayError(name, "Product title is required");
    isValid = false;
  } else {
    clearError(name, "Type here");
  }

  if (description.value.trim() === "") {
    displayError(description, "Full description is required");
    isValid = false;
  } else {
    clearError(description, "Type here");
  }

  if (price.value.trim() === "") {
    displayError(price, "Promotional price is required");
    isValid = false;
  } else {
    clearError(price, "₹");
  }

  if (originalPrice.value.trim() === "") {
    displayError(originalPrice, "Regular price is required");
    isValid = false;
  } else {
    clearError(originalPrice, "₹");
  }

  if (stock.value.trim() === "") {
    displayError(stock, "Stock is required");
    isValid = false;
  } else {
    clearError(stock, "Enter stock");
  }

  if (category.value === "") {
    displayError(category, "Category is required");
    isValid = false;
  } else {
    clearError(category, "Select Category");
  }

  if (brand.value === "") {
    displayError(brand, "Brand is required");
    isValid = false;
  } else {
    clearError(brand, "Select Brand");
  }

  if (highlights.value.trim() === "") {
    displayError(highlights, "Tags are required");
    isValid = false;
  } else {
    clearError(highlights, "Enter highlights");
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