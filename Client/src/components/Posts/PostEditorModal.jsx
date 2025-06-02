import React, { useRef, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { postsAPI } from "../../services/apiServices";
import toast from "react-hot-toast";
import "../../assets/Css/CreatePost.css";
import { useNavigate } from "react-router-dom";
import EmojiPicker from "../EmojiPicker";
import MentionInput from "./MentionInput";
import ModalPortal from "../ModalPortal";

/**
 * Modal component for creating and editing posts
 * Handles post creation, mentions, emojis, and file uploads
 */
const PostEditorModal = ({
  isOpen,
  onClose,
  onSubmit,
  content,
  setContent,
  isSubmitting,
  setIsSubmitting,
  saveDraft,
  deleteDraft,
  files,
  setFiles,
  channelId,
}) => {
  const modalRef = useRef(null);
  const [isEditing, setIsEditing] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const navigate = useNavigate();

  /**
   * Handle closing the modal
   * Saves draft if content exists
   */
  const handleClose = () => {
    setIsClosing(true);
    if (content.trim()) {
      saveDraft();
    }
    onClose();
    setTimeout(() => setIsClosing(false), 100);
  };

  /**
   * Toggle between edit and preview modes
   */
  const toggleEditMode = () => {
    if (content || !isEditing) {
      setIsEditing(!isEditing);
    }
  };

  /**
   * Handle clicks in preview mode
   * Navigates for mentions, opens links in new tab
   */
  const handlePreviewClick = (e) => {
    if (e.target.tagName === 'A') {
      e.preventDefault();
      const href = e.target.getAttribute('href');
      if (href.startsWith('/profile/view/')) {
        navigate(href);
      } else {
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    } else {
      toggleEditMode();
    }
  };

  /**
   * Handle file uploads
   */
  const handleFileUpload = (event) => {
    const uploadedFiles = Array.from(event.target.files);
    setFiles((prevFiles) => [...prevFiles, ...uploadedFiles]);
  };

  /**
   * Remove a file from the upload list
   */
  const removeFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  /**
   * Upload files to Cloudinary
   */
  const uploadFilesToCloudinary = async () => {
    const uploadedFiles = [];
    
    for (const file of files) {
      const formData = new FormData();
      formData.append("files", file);

      try {
        const response = await postsAPI.uploadFile(formData);
        
        if (Array.isArray(response.data) && response.data.length > 0) {
          const fileData = response.data[0];
          if (fileData.id && fileData.fileUrl) {
            uploadedFiles.push({
              fileUrl: fileData.fileUrl,
              fileId: fileData.id,
            });
          }
        }
      } catch (error) {
        console.error("File upload error:", error);
        toast.error("Échec du téléchargement du fichier.");
        throw error;
      }
    }

    return uploadedFiles;
  };

  /**
   * Handle post submission
   */
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      let uploadedFiles = [];
      if (files.length > 0) {
        uploadedFiles = await uploadFilesToCloudinary();
      }

      const postData = {
        content: content || "",
        fileUrls: uploadedFiles.map((file) => file.fileUrl),
        fileIds: uploadedFiles.map((file) => file.fileId),
        channelId: channelId || null,
        isPublic: true
      };

      if (content.trim() || uploadedFiles.length > 0) {
        await onSubmit(postData);
      } else {
        toast.error("Veuillez ajouter du texte ou des fichiers.");
      }
    } catch (error) {
      console.error("Post submission error:", error);
      toast.error("Échec de la publication.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only close if click is truly outside the modal and not on any interactive element inside
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target) &&
        !event.target.closest('.mention-input') &&
        !event.target.closest('.tribute-container') &&
        !event.target.closest('.post-editor-content') &&
        !event.target.closest('input') &&
        !event.target.closest('textarea') &&
        !event.target.closest('.EmojiPickerReact') &&
        !event.target.closest('.file-upload-section') &&
        !event.target.closest('.file-upload-button') &&
        !event.target.closest('.file-preview-container')
      ) {
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
    <>
      {isOpen && (
        <ModalPortal>
          <div className="post-editor-overlay">
            <div className="post-editor-content" ref={modalRef}>
              <div className="post-editor-header">
                <h1>Créer une publication</h1>
                <FontAwesomeIcon
                  icon={faTimes}
                  className="close-icon"
                  onClick={handleClose}
                />
              </div>
              <div className="post-editor-textarea-container">
                {isEditing ? (
                  <MentionInput
                    content={content}
                    setContent={setContent}
                    isEditing={isEditing}
                    placeholder="Tapez @ pour mentionner quelqu'un"
                  />
                ) : (
                  <div
                    className="post-preview"
                    onClick={handlePreviewClick}
                    dangerouslySetInnerHTML={{ __html: formatTextWithLinks(content) }}
                  />
                )}
              </div>
              <div className="date-file-container">
                <div className="file-upload-section">
                  <EmojiPicker 
                    onSelect={(emoji) => {
                      setContent(prev => prev + emoji.native);
                      setShowEmojiPicker(false);
                    }}
                    show={showEmojiPicker}
                    setShow={setShowEmojiPicker}
                  />
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
                      style={{ width: "35px", height: "35px" }}>
                    </lord-icon>
                  </label>
                </div>
              </div>
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
              <div className="post-editor-actions">
                <button
                  type="button"
                  onClick={deleteDraft}
                  disabled={isSubmitting || !localStorage.getItem("draftPost")}
                  className="delete-draft-button"
                >
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
                  disabled={isSubmitting || (!content.trim() && files.length === 0)}
                  className="submit-button"
                >
                  {isSubmitting ? "Publication en cours..." : "Publier"}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
};

/**
 * Format text with clickable links and mentions
 */
function formatTextWithLinks(text) {
  if (!text) return "";
  
  // Replace URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  let formattedText = text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
  
  // Replace mentions with profile links
  const mentionRegex = /@\[([^\]]+)\]\(user:([^\)]+)\)/g;
  formattedText = formattedText.replace(mentionRegex, (match, display, id) => {
    return `<a href="/profile/view/${id}" class="user-mention">@${display}</a>`;
  });

  return formattedText;
}

export default PostEditorModal;