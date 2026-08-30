
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LostItem.css";

function LostItem() {
  const navigate = useNavigate();

  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState("");
  const [errors, setErrors] = useState({});

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];

    if (!file) {
      setPhoto("");
      return;
    }

    // Allow only images
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      e.target.value = "";
      setPhoto("");
      return;
    }

    // Limit photo size to 2 MB
    if (file.size > 2 * 1024 * 1024) {
      alert("Photo size must be less than 2 MB.");
      e.target.value = "";
      setPhoto("");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setPhoto(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};

    // Item Name validation
    if (!itemName.trim()) {
      newErrors.itemName = "Please enter the item name.";
    } else if (itemName.trim().length < 2) {
      newErrors.itemName =
        "Item name must be at least 2 characters.";
    }

    // Category validation
    if (!category) {
      newErrors.category = "Please select a category.";
    }

    // Location validation
    if (!location.trim()) {
      newErrors.location =
        "Please enter where you lost the item.";
    } else if (location.trim().length < 2) {
      newErrors.location =
        "Location must be at least 2 characters.";
    }

    // Date validation
    if (!date) {
      newErrors.date = "Please select the date.";
    } else {
      const selectedDate = new Date(date);
      const today = new Date();

      today.setHours(0, 0, 0, 0);

      if (selectedDate > today) {
        newErrors.date =
          "Lost date cannot be in the future.";
      }
    }

    // Description validation
    if (!description.trim()) {
      newErrors.description =
        "Please describe your item.";
    } else if (description.trim().length < 10) {
      newErrors.description =
        "Description must be at least 10 characters.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Get logged-in user
    const loggedInUser = JSON.parse(
      localStorage.getItem("loggedInUser")
    );

    if (!loggedInUser) {
      alert("Please login first.");
      navigate("/login");
      return;
    }

    const newReport = {
      id: Date.now(),
      type: "Lost",
      userEmail: loggedInUser.collegeId,
      userName: loggedInUser.name,
      itemName: itemName.trim(),
      category,
      location: location.trim(),
      date,
      description: description.trim(),
      photo,
      status: "Pending",
    };

    // Save report
    const existingReports =
      JSON.parse(localStorage.getItem("reports")) || [];

    localStorage.setItem(
      "reports",
      JSON.stringify([
        ...existingReports,
        newReport,
      ])
    );

    // Save activity
    const existingActivities =
      JSON.parse(localStorage.getItem("activities")) || [];

    const newActivity = {
      id: Date.now() + 1,
      type: "Lost",
      itemName: newReport.itemName,
      userEmail: loggedInUser.collegeId,
      message: `You reported a lost item — ${newReport.itemName}`,
      time: new Date().toLocaleString(),
    };

    localStorage.setItem(
      "activities",
      JSON.stringify([
        ...existingActivities,
        newActivity,
      ])
    );

    alert("Lost item report submitted successfully!");

    // Clear form
    setItemName("");
    setCategory("");
    setLocation("");
    setDate("");
    setDescription("");
    setPhoto("");
    setErrors({});

    // Go back to dashboard
    navigate("/dashboard");
  };

  return (
    <div className="lost-item-page">

      <div className="lost-item-container">

        <div className="lost-item-header">

          <p className="lost-item-label">
            CAMPUS RECOVERY
          </p>

          <h1>
            Report a Lost Item
          </h1>

          <p>
            Tell us about the item you lost and help us find a possible match.
          </p>

        </div>

        <form
          className="lost-item-form"
          onSubmit={handleSubmit}
        >

          {/* Item Name */}
          <div className="form-group">

            <label>
              Item Name
            </label>

            <input
              type="text"
              placeholder="e.g. Black Boat Earphones"
              value={itemName}
              onChange={(e) =>
                setItemName(e.target.value)
              }
            />

            {errors.itemName && (
              <p className="form-error">
                {errors.itemName}
              </p>
            )}

          </div>


          {/* Category */}
          <div className="form-group">

            <label>
              Category
            </label>

            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
            >

              <option value="">
                Select a category
              </option>

              <option value="electronics">
                Electronics
              </option>

              <option value="documents">
                Documents
              </option>

              <option value="wallet">
                Wallet / Money
              </option>

              <option value="keys">
                Keys
              </option>

              <option value="bag">
                Bag
              </option>

              <option value="clothing">
                Clothing
              </option>

              <option value="other">
                Other
              </option>

            </select>

            {errors.category && (
              <p className="form-error">
                {errors.category}
              </p>
            )}

          </div>


          {/* Location */}
          <div className="form-group">

            <label>
              Where did you lose it?
            </label>

            <input
              type="text"
              placeholder="e.g. College Library"
              value={location}
              onChange={(e) =>
                setLocation(e.target.value)
              }
            />

            {errors.location && (
              <p className="form-error">
                {errors.location}
              </p>
            )}

          </div>


          {/* Date */}
          <div className="form-group">

            <label>
              Date Lost
            </label>

            <input
              type="date"
              value={date}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) =>
                setDate(e.target.value)
              }
            />

            {errors.date && (
              <p className="form-error">
                {errors.date}
              </p>
            )}

          </div>


          {/* Description */}
          <div className="form-group">

            <label>
              Describe the Item
            </label>

            <textarea
              placeholder="Add details that can help identify your item..."
              rows="5"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
            />

            {errors.description && (
              <p className="form-error">
                {errors.description}
              </p>
            )}

          </div>


          {/* Photo */}
          <div className="form-group">

            <label>
              Upload Photo <span>(Optional)</span>
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
            />

            {photo && (
              <div style={{ marginTop: "12px" }}>
                <img
                  src={photo}
                  alt="Selected item"
                  style={{
                    width: "150px",
                    height: "150px",
                    objectFit: "cover",
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                  }}
                />
              </div>
            )}

          </div>


          {/* Submit */}
          <button
            type="submit"
            className="lost-submit-btn"
          >
            🔴 Submit Lost Report
          </button>

        </form>

      </div>

    </div>
  );
}

export default LostItem;
