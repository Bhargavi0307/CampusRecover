import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./LostItem.css";

function LostItem() {
  const navigate = useNavigate();

  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(""); // preview साठी (base64)
  const [photoFile, setPhotoFile] = useState(null); // actual file, upload साठी
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];

    if (!file) {
      setPhoto("");
      setPhotoFile(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      e.target.value = "";
      setPhoto("");
      setPhotoFile(null);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Photo size must be less than 2 MB.");
      e.target.value = "";
      setPhoto("");
      setPhotoFile(null);
      return;
    }

    setPhotoFile(file);

    const reader = new FileReader();

    reader.onloadend = () => {
      setPhoto(reader.result);
    };

    reader.readAsDataURL(file);
  };

  // ============================
  // UPLOAD PHOTO TO SUPABASE STORAGE
  // ============================
  const uploadPhoto = async (file, userId) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("item-photos")
      .upload(fileName, file);

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data } = supabase.storage
      .from("item-photos")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
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

    setLoading(true);

    try {
      // Get currently logged-in Supabase user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Auth error:", userError);
        alert("Unable to verify your login. Please login again.");
        navigate("/login");
        return;
      }

      if (!user) {
        alert("Please login first.");
        navigate("/login");
        return;
      }

      console.log("Current Supabase User ID:", user.id);

      // Get user's profile
      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("name, college_id")
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) {
        console.error(
          "Profile fetch error:",
          profileError
        );

        alert(
          `Profile error: ${profileError.message}`
        );

        return;
      }

      if (!profile) {
        console.error(
          "Profile not found for user ID:",
          user.id
        );

        alert(
          "Your profile was not found. Please contact support."
        );

        return;
      }

      console.log("Profile found:", profile);

      // ============================
      // UPLOAD PHOTO FIRST (if one was selected)
      // ============================
      let photoUrl = null;

      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile, user.id);

        if (!photoUrl) {
          alert(
            "Photo upload failed. Please try again or submit without a photo."
          );
          setLoading(false);
          return;
        }
      }

      // Insert report into Supabase
      const { data: insertedReport, error: reportError } =
        await supabase
          .from("lost_reports")
          .insert([
            {
              user_id: user.id,
              user_email:
                profile.college_id || user.email,
              user_name:
                profile.name || "User",
              item_name: itemName.trim(),
              category: category,
              location: location.trim(),
              lost_date: date,
              description: description.trim(),
              photo: photoUrl, // आता base64 नाही, URL जातोय
              status: "Pending",
            },
          ])
          .select()
          .single();

      if (reportError) {
        console.error(
          "Lost report submission error:",
          reportError
        );

        alert(
          `Report submission failed: ${reportError.message}`
        );

        return;
      }

      console.log(
        "Lost report successfully created:",
        insertedReport
      );

      alert(
        "Lost item report submitted successfully! 🎉"
      );

      // Clear form
      setItemName("");
      setCategory("");
      setLocation("");
      setDate("");
      setDescription("");
      setPhoto("");
      setPhotoFile(null);
      setErrors({});

      // Go back to dashboard
      navigate("/dashboard");

    } catch (error) {
      console.error("Lost item error:", error);

      alert(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
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
              max={
                new Date()
                  .toISOString()
                  .split("T")[0]
              }
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
            disabled={loading}
          >
            {loading
              ? "Submitting..."
              : "🔴 Submit Lost Report"}
          </button>

        </form>

      </div>

    </div>
  );
}

export default LostItem;