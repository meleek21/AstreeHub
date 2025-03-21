import React, { useState, useRef, useEffect } from "react";
import { Mention, MentionsInput } from "react-mentions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { postsAPI } from "../services/apiServices";
import toast from "react-hot-toast";
import "../assets/Css/CreatePost.css";

// Fetch users for mentions
const fetchUsers = (query, callback) => {
  const users = [
    { id: "1", display: "John Doe" },
    { id: "2", display: "Jane Smith" },
  ];

  const filteredUsers = users.filter((user) =>
    user.display.toLowerCase().includes(query.toLowerCase())
  );

  callback(filteredUsers || []);
};

const PostEditorModal = ({
  isOpen,
  onClose,
  onSubmit,
  content,
  setContent,
  isSubmitting,
  setIsSubmitting,
  scheduledTime,
  setScheduledTime,
  saveDraft,
  deleteDraft,
  files,
  setFiles,
  channelId,
}) => {
  const modalRef = useRef(null);

  const handleFileUpload = (event) => {
    const uploadedFiles = Array.from(event.target.files);
    setFiles((prevFiles) => [...prevFiles, ...uploadedFiles]);
    console.log("Files selected:", uploadedFiles);
  };

  const removeFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    console.log("File removed at index:", index);
  };

  const uploadFilesToCloudinary = async () => {
    const uploadedFiles = [];
    console.log("Starting file upload process...");

    for (const file of files) {
      const formData = new FormData();
      formData.append("files", file);
      console.log("Prepared form data for file:", file.name);

      try {
        console.log("Uploading file to Cloudinary...");
        const response = await postsAPI.uploadFile(formData);
        console.log("Upload response:", response.data);

        if (Array.isArray(response.data) && response.data.length > 0) {
          const fileData = response.data[0];
          console.log("File data from response:", fileData);

          if (fileData.id && fileData.fileUrl) {
            uploadedFiles.push({
              fileUrl: fileData.fileUrl,
              fileId: fileData.id,
            });
            console.log("File added to uploadedFiles:", fileData);
          } else {
            console.error("File data is missing required fields (id or fileUrl):", fileData);
          }
        } else {
          console.error("Invalid response format:", response.data);
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        toast.error("Failed to upload file.");
        throw error;
      }
    }

    console.log("All files uploaded successfully. Uploaded files:", uploadedFiles);
    return uploadedFiles;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    console.log("Starting post submission process...");

    try {
      let uploadedFiles = [];
      if (files.length > 0) {
        console.log("Uploading files to Cloudinary...");
        uploadedFiles = await uploadFilesToCloudinary();
        console.log("Uploaded files:", uploadedFiles);
      }

      const postData = {
        content: content || "", // Ensure content is always included, even if empty
        fileUrls: uploadedFiles.map((file) => file.fileUrl),
        fileIds: uploadedFiles.map((file) => file.fileId),
        channelId: channelId || null, // Use channelId from props
      };
      console.log("Post data prepared:", postData);

      // Submit if either content or files are present
      if (content.trim() || uploadedFiles.length > 0) {
        onSubmit(postData);
        console.log("Post submitted successfully.");
      } else {
        toast.error("Veuillez ajouter du texte ou des fichiers.");
      }
    } catch (error) {
      console.error("Error submitting post:", error);
      toast.error("Failed to submit post.");
    } finally {
      setIsSubmitting(false);
      console.log("Submission process completed.");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        if (content.trim()) {
          saveDraft();
        }
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, content, onClose, saveDraft]);

  if (!isOpen) return null;

  return (
    <div className="post-editor-overlay">
      <div className="post-editor-content" ref={modalRef}>
        <div className="post-editor-header">
          <h1>Créer une Publication</h1>
          <FontAwesomeIcon
            icon={faTimes}
            className="close-icon"
            onClick={() => {
              if (content.trim()) {
                saveDraft();
              }
              onClose();
            }}
          />
        </div>
        <hr />
        <MentionsInput
          value={content || ""}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Écrivez votre publication ici..."
          disabled={isSubmitting}
          a11ySuggestionsListLabel="Utilisateurs suggérés"
          className="mentions-input"
        >
          <Mention
            trigger="@"
            data={fetchUsers}
            markup="@[__display__](__id__)"
            renderSuggestion={(suggestion, search, highlightedDisplay) => (
              <div className="user-suggestion">{highlightedDisplay}</div>
            )}
          />
          <Mention
            trigger="#"
            data={[]}
            markup="#[__display__](__id__)"
          />
        </MentionsInput>

        {/* Date Picker and File Upload Section */}
        <div className="date-file-container">
          <input
            type="datetime-local"
            value={scheduledTime || ""}
            onChange={(e) => setScheduledTime(e.target.value)}
            disabled={isSubmitting}
            aria-label="Planifier la publication"
            className="datetime-input"
          />

          <div className="file-upload-section">
            <input
              type="file"
              id="file-upload"
              multiple
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
            <label htmlFor="file-upload" className="file-upload-button">
              <lord-icon
                src="https://cdn.lordicon.com/xtzwzauj.json"
                trigger="morph"
                state="morph-sea"
                style={{ width: "35px", height: "35px" }}
              ></lord-icon>
              <lord-icon
                src="https://cdn.lordicon.com/wsbmifnf.json"
                trigger="morph"
                style={{ width: "35px", height: "35px" }}
              ></lord-icon>
            </label>
          </div>
        </div>

        {/* File Preview */}
        {files.length > 0 && (
          <div className="file-preview-container">
            {files.map((file, index) => (
              <div key={index} className="file-preview">
                <span>{file.name}</span>
                <button onClick={() => removeFile(index)} className="remove-file-button">
                  <lord-icon
                    src="https://cdn.lordicon.com/skkahier.json"
                    trigger="hover"
                    colors="primary:#c71f16"
                    style={{ width: "20px", height: "20px" }}
                  ></lord-icon>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="post-editor-actions">
          <button
            type="button"
            onClick={deleteDraft}
            disabled={isSubmitting || !localStorage.getItem("draftPost")}
            className="delete-draft-button"
          >
            <lord-icon
              src="https://cdn.lordicon.com/skkahier.json"
              trigger="hover"
              state="morph-trash-full"
              colors="primary:#c71f16;secondary:#ffffff"
              style={{ width: "25px", height: "25px" }}
              className="trash-icon"
            ></lord-icon>
            Supprimer
          </button>

          <button
            type="button"
            onClick={saveDraft}
            disabled={isSubmitting || !content.trim()}
            className="save-draft-button"
          >
            Enregistrer
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || (!content.trim() && files.length === 0)} // Disable if both content and files are empty
            className="submit-button"
          >
            {isSubmitting ? "Envoi en cours..." : scheduledTime ? "Planifier" : "Publier"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostEditorModal;