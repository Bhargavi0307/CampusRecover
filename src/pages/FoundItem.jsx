import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./FoundItem.css";

function FoundItem() {
  const navigate = useNavigate();

  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(""); 
  const [photoFile, setPhotoFile] = useState(null); // actual file, upload 
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

    // Item Name
    if (!itemName.trim()) {
      newErrors.itemName = "Please enter the item name.";
    } else if (itemName.trim().length < 2) {
      newErrors.itemName =
        "Item name must be at least 2 characters.";
    }

    // Category
    if (!category) {
      newErrors.category = "Please select a category.";
    }

    // Location
    if (!location.trim()) {
      newErrors.location =
        "Please enter where you found the item.";
    } else if (location.trim().length < 2) {
      newErrors.location =
        "Location must be at least 2 characters.";
    }

    // Date
    if (!date) {
      newErrors.date = "Please select the date.";
    } else {
      const selectedDate = new Date(date);
      const today = new Date();

      today.setHours(0, 0, 0, 0);

      if (selectedDate > today) {
        newErrors.date =
          "Found date cannot be in the future.";
      }
    }

    // Description
    if (!description.trim()) {
      newErrors.description =
        "Please describe the item.";
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
      // Get authenticated Supabase user
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
        alert("Your session has expired. Please login again.");
        navigate("/login");
        return;
      }

      // Get profile
      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("name, college_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);

        alert(
          "Unable to load your profile. Please try again."
        );

        return;
      }

      if (!profile) {
        alert(
          "Profile not found. Please contact the administrator."
        );

        return;
      }

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

      // Insert found report into Supabase
      const { data: insertedReport, error: reportError } =
        await supabase
          .from("found_reports")
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
              found_date: date,
              description: description.trim(),
              photo: photoUrl, // आता इथे base64 नाही, URL जातोय
              status: "Pending",
            },
          ])
          .select()
          .single();

      if (reportError) {
        console.error(
          "Found report submission error:",
          reportError
        );

        alert(
          `Failed to submit your found item report.\n\n${reportError.message}`
        );

        return;
      }

      console.log(
        "Found report successfully saved:",
        insertedReport
      );

      alert(
        "Found item report submitted successfully! 🎉"
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

      // Go to dashboard
      navigate("/dashboard");

    } catch (error) {
      console.error("Found item error:", error);

      alert(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="found-item-page">

      <div className="found-item-container">

        <div className="found-item-header">

          <p className="found-item-label">
            CAMPUS RECOVERY
          </p>

          <h1>
            Report a Found Item
          </h1>

          <p>
            Help a student recover their lost belongings by reporting the item.
          </p>

        </div>

        <form
          className="found-item-form"
          onSubmit={handleSubmit}
        >

          {/* Item Name */}
          <div className="form-group">

            <label>
              Item Name
            </label>

            <input
              type="text"
              placeholder="e.g. Black Wallet"
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
              Where did you find it?
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
              Date Found
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
              placeholder="Add details that can help identify the item..."
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
                  alt="Selected found item"
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
            className="found-submit-btn"
            disabled={loading}
          >
            {loading
              ? "Submitting..."
              : "🟢 Submit Found Item"}
          </button>

        </form>

      </div>

    </div>
  );
}

export default FoundItem;