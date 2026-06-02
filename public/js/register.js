const validations = {
    email: {
        regex: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
        message: "Please enter a valid email address"
    },
    phoneNumber: {
        regex: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4}$/,
        message: "Please enter a valid phone number (e.g., 123-456-7890)"
    },
    fullName: {
        regex: /^[a-zA-Z\s'-]{2,50}$/,
        message: "Full name should only contain letters, spaces, hyphens, and apostrophes (2-50 characters)"
    }
};

// Function to create and show error message
function showError(input, message) {
    const existingError = input.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = 'red';
    errorDiv.style.fontSize = '12px';
    errorDiv.style.marginTop = '5px';
    errorDiv.textContent = message;
    input.parentElement.appendChild(errorDiv);
    input.style.borderColor = 'red';
}

// Function to remove error message
function removeError(input) {
    const errorDiv = input.parentElement.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.remove();
    }
    input.style.borderColor = '';
}

// Real-time validation for each field
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', function () {
        const fieldName = this.name;
        const validation = validations[fieldName];

        if (validation) {
            if (this.value && !validation.regex.test(this.value)) {
                showError(this, validation.message);
            } else {
                removeError(this);
            }
        }
    });
});

// Form submission handler with loader
document.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    let hasErrors = false;

    const loader = document.getElementById("loader");
    loader.className = 'loader';
    loader.innerHTML = '<div></div><div></div><div></div><div></div>'; // Loader dots
    loader.style.display = 'flex';  // Force visibility
    loader.style.justifyContent = 'center';
    loader.style.marginTop = '20px';

    loader.style.cssText = `
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 20px auto;
    background: transparent;
`;

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    Object.keys(data).forEach(key => {
        const input = document.querySelector(`[name="${key}"]`);
        const validation = validations[key];

        if (validation) {
            if (!data[key].trim()) {
                showError(input, `${key.charAt(0).toUpperCase() + key.slice(1)} is required`);
                hasErrors = true;
            } else if (!validation.regex.test(data[key])) {
                showError(input, validation.message);
                hasErrors = true;
            }
        }
    });

    if (hasErrors) {
        loader.style.display = "none"; // Hide loader on error
        alert("Please enter all the fields correctly");
        return;
    }

    try {
        const response = await fetch("/users/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
            window.location.href = "/"; // Redirect to homepage
        } else {
            loader.style.display = "none"; // Hide loader on failure
            alert(result.message); // Display error messages
        }
    } catch (error) {
        console.error("Error:", error);
        loader.style.display = "none"; // Hide loader on exception
        alert("Something went wrong. Please try again.");
    }
});

// Add basic styles for the form fields
document.querySelectorAll('.input-group input').forEach(input => {
    input.style.transition = 'border-color 0.3s ease';
});
