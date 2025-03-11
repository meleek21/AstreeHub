import React, { useState, useRef, useEffect } from "react";
import { Mention, MentionsInput } from "react-mentions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
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
  scheduledTime,
  setScheduledTime,
  saveDraft,
  deleteDraft,
}) => {
  const modalRef = useRef(null);
  const [files, setFiles] = useState([]);

  const handleFileUpload = (event) => {
    const uploadedFiles = Array.from(event.target.files);
    setFiles((prevFiles) => [...prevFiles, ...uploadedFiles]);
  };

  const removeFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
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
          <h1 >Créer une Publication</h1>
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
          {/* Date Picker */}
          <input
            type="datetime-local"
            value={scheduledTime || ""}
            onChange={(e) => setScheduledTime(e.target.value)}
            disabled={isSubmitting}
            aria-label="Planifier la publication"
            className="datetime-input"
          />

          {/* File Upload Section */}
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
                style={{ width: '35px', height: '35px' }}
              ></lord-icon>
              <lord-icon
                src="https://cdn.lordicon.com/wsbmifnf.json"
                trigger="morph"
                style={{ width: '35px', height: '35px' }}
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
                    style={{ width: '20px', height: '20px' }}
                  ></lord-icon>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="post-editor-actions">
          {/* Delete Draft Button */}
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
              style={{ width: '25px', height: '25px' }}
              className="trash-icon"
            ></lord-icon>
            Supprimer
          </button>

          {/* Save Draft Button */}
          <button
            type="button"
            onClick={saveDraft}
            disabled={isSubmitting || !content.trim()}
            className="save-draft-button"
          >
            Enregistrer
          </button>

          {/* Submit Button */}
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || !content.trim()}
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