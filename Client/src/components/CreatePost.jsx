import React, { useState, useEffect } from "react";
import { useAuth } from "../Context/AuthContext";
import { postsAPI } from "../services/apiServices";
import toast from "react-hot-toast";
import PostEditorModal from "./PostEditorModal";
import "../assets/Css/CreatePost.css";

const placeholderPhrases = [
  "Qu'avez-vous en tête aujourd'hui ?",
  "Partagez votre idée avec le monde !",
  "Une pensée à exprimer ? Écrivez-la ici...",
  "Exprimez votre créativité...",
  "Dites quelque chose d'inspirant !",
];

const CreatePost = () => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduledTime, setScheduledTime] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [files, setFiles] = useState([]); // State to store selected files
  const { user } = useAuth();
  const userId = user?.id;

  const [placeholder, setPlaceholder] = useState("");

  useEffect(() => {
    setPlaceholder(placeholderPhrases[Math.floor(Math.random() * placeholderPhrases.length)]);
  }, []);

  const saveDraft = () => {
    localStorage.setItem("draftPost", content);
    toast.success("Brouillon enregistré !");
  };

  const deleteDraft = () => {
    localStorage.removeItem("draftPost");
    setContent("");
    toast.success("Brouillon supprimé !");
  };

  const handleSubmit = async (postData) => {
    setIsSubmitting(true);

    try {
      // Create the post with file URLs and IDs
      const requestBody = {
        content: postData.content,
        authorId: userId,
        isPublic: true,
        scheduledTime: scheduledTime || null,
        fileUrls: postData.fileUrls,
        fileIds: postData.fileIds // Include file IDs in the request
      };

      const response = await postsAPI.createPost(requestBody);
      console.log("Publication créée :", response.data);
      toast.success(scheduledTime ? "Publication planifiée !" : "Publication créée avec succès !");
      setContent("");
      setScheduledTime(null);
      setFiles([]); // Clear selected files
      localStorage.removeItem("draftPost");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erreur lors de la création de la publication :", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Une erreur s'est produite.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="create-post-container">
        <input
          type="text"
          placeholder={placeholder}
          onClick={() => setIsModalOpen(true)}
          readOnly
          className="create-post-input"
        />
      </div>

      <PostEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        content={content}
        setContent={setContent}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
        scheduledTime={scheduledTime}
        setScheduledTime={setScheduledTime}
        saveDraft={saveDraft}
        deleteDraft={deleteDraft}
        files={files}
        setFiles={setFiles} // Pass files and setFiles to the modal
      />
    </>
  );
};

export default CreatePost;